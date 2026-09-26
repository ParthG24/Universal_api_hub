from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Universal AI API Hub"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "universal-ai-hub-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database configuration (PostgreSQL or local SQLite for development)
    DATABASE_URL: str = "sqlite:///./universal_hub.db"

    # AI Provider Keys (Kept server-side only, never leaked to frontend/logs)
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Default admin credentials for seeding
    ADMIN_EMAIL: str = "admin@universalhub.dev"
    ADMIN_PASSWORD: str = "Admin123!"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v


settings = Settings()
