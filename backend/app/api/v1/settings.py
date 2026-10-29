from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.institute import Institute
from app.schemas.communication import InstituteUpdate, InstituteResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import get_current_user, require_admin

router = APIRouter()


@router.get("", response_model=ApiResponse[InstituteResponse])
def get_institute_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    institute = db.query(Institute).filter(Institute.id == current_user.institute_id).first()
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")

    return ApiResponse(data=InstituteResponse.model_validate(institute))


@router.put("", response_model=ApiResponse[InstituteResponse])
def update_institute_settings(
    payload: InstituteUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    institute = db.query(Institute).filter(Institute.id == admin.institute_id).first()
    if not institute:
        raise HTTPException(status_code=404, detail="Institute not found")

    if payload.name is not None:
        institute.name = payload.name
    if payload.logo_url is not None:
        institute.logo_url = payload.logo_url
    if payload.address is not None:
        institute.address = payload.address
    if payload.contact_email is not None:
        institute.contact_email = payload.contact_email
    if payload.contact_phone is not None:
        institute.contact_phone = payload.contact_phone
    if payload.currency is not None:
        institute.currency = payload.currency
    if payload.timezone is not None:
        institute.timezone = payload.timezone
    if payload.settings is not None:
        institute.settings = payload.settings

    db.commit()
    db.refresh(institute)

    return ApiResponse(data=InstituteResponse.model_validate(institute), message="Institute settings updated")
