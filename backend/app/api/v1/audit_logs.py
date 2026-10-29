from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.communication import AuditLog
from app.schemas.communication import AuditLogResponse
from app.schemas.common import ApiResponse
from app.permissions.deps import require_admin

router = APIRouter()


@router.get("", response_model=ApiResponse[List[AuditLogResponse]])
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.institute_id == admin.institute_id)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for l in logs:
        u_name = l.user.profile.full_name if (l.user and l.user.profile) else "System"
        results.append(
            AuditLogResponse(
                id=l.id,
                user_name=u_name,
                action=l.action,
                entity_type=l.entity_type,
                entity_id=l.entity_id,
                ip_address=l.ip_address,
                details=l.details or {},
                timestamp=l.timestamp
            )
        )

    return ApiResponse(data=results)
