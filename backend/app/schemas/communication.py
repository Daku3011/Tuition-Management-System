from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.communication import AudienceType


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_audience: AudienceType = AudienceType.ALL
    batch_id: Optional[str] = None
    priority: str = "NORMAL"
    expires_at: Optional[datetime] = None


class AnnouncementResponse(BaseModel):
    id: str
    institute_id: str
    title: str
    content: str
    target_audience: AudienceType
    batch_id: Optional[str] = None
    priority: str
    published_at: datetime
    created_by_name: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    link: Optional[str] = None
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: str
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Dict[str, Any] = {}
    timestamp: datetime

    class Config:
        from_attributes = True


class InstituteUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class InstituteResponse(BaseModel):
    id: str
    name: str
    code: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    currency: str
    timezone: str
    settings: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class FeeMetricMonth(BaseModel):
    month: str
    collected: float
    target: float


class DashboardStatsResponse(BaseModel):
    active_students_count: int
    faculty_count: int
    active_batches_count: int
    today_classes_count: int
    today_attendance_percentage: float
    fees_collected_this_month: float
    outstanding_fee_balance: float
    overdue_installments_count: int
    upcoming_exams_count: int
    monthly_collection_trend: List[FeeMetricMonth] = []
