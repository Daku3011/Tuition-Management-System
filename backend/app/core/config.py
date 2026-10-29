import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Apex Tuition Management System"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8001

    # Database
    DATABASE_URL: str = "sqlite:///./tuition_dev.db"
    TEST_DATABASE_URL: str = "sqlite:///./tuition_test.db"

    # Security
    AUTH_SECRET_KEY: str = "change-this-to-a-super-secure-random-secret-key-at-least-32-chars-for-dev"
    AUTH_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    CORS_ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:8081",
        "exp://localhost:8081",
        "https://tuition-management-web.vercel.app"
    ]

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Redis Configuration (Caching, Sessions & Background Queues)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = True
    REDIS_SESSION_TTL_SECONDS: int = 604800  # 7 days
    REDIS_CACHE_TTL_DEFAULT: int = 300       # 5 minutes

    # Supabase / Object Storage
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "tuition-documents"

    # Transactional Email (Mockable in dev)
    EMAIL_PROVIDER_API_KEY: str = "mock-key"
    EMAIL_FROM: str = "notifications@tuitionsystem.com"

    # Payment Gateway
    PAYMENT_PROVIDER_KEY_ID: str = "rzp_test_sampleKey123"
    PAYMENT_PROVIDER_KEY_SECRET: str = "rzp_secret_sampleSecretKey123"
    PAYMENT_WEBHOOK_SECRET: str = "sample_webhook_secret_123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
