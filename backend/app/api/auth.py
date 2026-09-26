from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Admin
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.core.deps import get_current_admin
from app.schemas.auth import LoginRequest, TokenResponse, AdminInfo

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])


@router.post("/login", response_model=TokenResponse)
async def login_admin(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates admin and returns a signed JWT access token."""
    admin = db.query(Admin).filter(Admin.email == payload.email.lower().strip()).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=admin.email, expires_delta=access_token_expires)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        email=admin.email,
    )


@router.get("/me", response_model=AdminInfo)
async def get_me(admin: Admin = Depends(get_current_admin)):
    """Returns the authenticated admin's profile."""
    return admin
