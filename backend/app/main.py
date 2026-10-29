import time
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.api.v1 import (
    auth,
    students,
    faculty,
    courses,
    batches,
    timetable,
    attendance,
    assignments,
    study_materials,
    examinations,
    fees,
    announcements,
    notifications,
    reports,
    settings as settings_api,
    audit_logs,
)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS if isinstance(settings.CORS_ALLOWED_ORIGINS, list) else [settings.CORS_ALLOWED_ORIGINS],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Global Exception Handler (Ensures CORS headers are returned on 500 errors)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.exception(f"Unhandled server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred.",
            "detail": str(exc),
        },
    )


# Standardized Validation Error Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(l) for l in err.get("loc", []) if l != "body"])
        errors.append({"field": loc, "message": err.get("msg", "Invalid value")})
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error_code": "VALIDATION_ERROR",
            "message": "Input validation failed. Please check the supplied fields.",
            "details": errors
        }
    )


# Health & Readiness checks
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "env": settings.APP_ENV,
        "version": "1.0.0"
    }


@app.get("/ready", tags=["System"])
def readiness_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": f"connection failed: {str(e)}"}
        )


# API v1 Routers
api_v1_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Authentication"])
app.include_router(students.router, prefix=f"{api_v1_prefix}/students", tags=["Students"])
app.include_router(faculty.router, prefix=f"{api_v1_prefix}/faculty", tags=["Faculty"])
app.include_router(courses.router, prefix=f"{api_v1_prefix}/courses", tags=["Courses"])
app.include_router(batches.router, prefix=f"{api_v1_prefix}/batches", tags=["Batches"])
app.include_router(timetable.router, prefix=f"{api_v1_prefix}/timetable", tags=["Timetable"])
app.include_router(attendance.router, prefix=f"{api_v1_prefix}/attendance", tags=["Attendance"])
app.include_router(assignments.router, prefix=f"{api_v1_prefix}/assignments", tags=["Assignments"])
app.include_router(study_materials.router, prefix=f"{api_v1_prefix}/study-materials", tags=["Study Materials"])
app.include_router(examinations.router, prefix=f"{api_v1_prefix}/examinations", tags=["Examinations"])
app.include_router(fees.router, prefix=f"{api_v1_prefix}/fees", tags=["Fees & Payments"])
app.include_router(announcements.router, prefix=f"{api_v1_prefix}/announcements", tags=["Announcements"])
app.include_router(notifications.router, prefix=f"{api_v1_prefix}/notifications", tags=["Notifications"])
app.include_router(reports.router, prefix=f"{api_v1_prefix}/reports", tags=["Reports & Analytics"])
app.include_router(settings_api.router, prefix=f"{api_v1_prefix}/settings", tags=["Institute Settings"])
app.include_router(audit_logs.router, prefix=f"{api_v1_prefix}/audit-logs", tags=["Audit Logs"])
