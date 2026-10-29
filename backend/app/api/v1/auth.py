from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_random_token,
)
from app.models.user import User, UserProfile, UserRole
from app.models.communication import AuditLog
from app.models.base import utc_now
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    UserResponse,
    InviteUserRequest,
    AcceptInvitationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin

router = APIRouter()


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact the administrator.",
        )
    
    # Update last login
    user.last_login_at = utc_now()
    
    # Write audit log
    audit = AuditLog(
        institute_id=user.institute_id,
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=user.id,
        details={"email": user.email, "role": user.role.value}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        institute_id=user.institute_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(subject=user.id)

    token_data = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )

    return ApiResponse(data=token_data, message="Login successful")


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        institute_id=user.institute_id
    )
    new_refresh = create_refresh_token(subject=user.id)

    return ApiResponse(
        data=TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user)
        ),
        message="Token refreshed"
    )


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(user: User = Depends(get_current_user)):
    return ApiResponse(data=UserResponse.model_validate(user))


@router.post("/invite", response_model=ApiResponse[dict])
def invite_user(
    request: InviteUserRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    token = generate_random_token(40)
    new_user = User(
        institute_id=admin.institute_id,
        email=request.email.lower().strip(),
        role=request.role,
        is_active=True,
        is_verified=False,
        invitation_token=token,
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(new_user)
    db.flush()

    profile = UserProfile(
        user_id=new_user.id,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone
    )
    db.add(profile)
    db.commit()

    return ApiResponse(
        data={"email": new_user.email, "invitation_token": token},
        message="Invitation dispatched successfully"
    )


@router.post("/accept-invitation", response_model=ApiResponse[dict])
def accept_invitation(request: AcceptInvitationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.invitation_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid invitation token")
    
    if user.invitation_expires_at and user.invitation_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation token has expired")
    
    user.hashed_password = get_password_hash(request.password)
    user.is_verified = True
    user.invitation_token = None
    user.invitation_expires_at = None
    db.commit()

    return ApiResponse(data={"email": user.email}, message="Account activated successfully. You can now log in.")


@router.post("/forgot-password", response_model=ApiResponse[dict])
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if user:
        token = generate_random_token(40)
        user.password_reset_token = token
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=2)
        db.commit()
        # In a real environment, trigger transactional email here.
        return ApiResponse(
            data={"reset_token": token},
            message="If the email exists, a password reset link has been dispatched."
        )
    return ApiResponse(data={}, message="If the email exists, a password reset link has been dispatched.")


@router.post("/reset-password", response_model=ApiResponse[dict])
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.password_reset_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    if user.password_reset_expires_at and user.password_reset_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    user.hashed_password = get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.commit()

    return ApiResponse(data={"email": user.email}, message="Password reset successfully. Please log in with your new password.")


@router.post("/change-password", response_model=ApiResponse[dict])
def change_password(
    request: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not user.hashed_password or not verify_password(request.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match")
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    return ApiResponse(data={}, message="Password changed successfully")
