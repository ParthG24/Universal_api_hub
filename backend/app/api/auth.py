import datetime
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Admin
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.deps import get_current_admin
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, AdminInfo

router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup_user(payload: SignupRequest, db: Session = Depends(get_db)):
    """Registers a new user and returns a signed JWT access token."""
    email_clean = payload.email.lower().strip()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    existing = db.query(Admin).filter(Admin.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in.",
        )

    new_user = Admin(
        email=email_clean,
        password_hash=get_password_hash(payload.password),
        created_at=datetime.datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(subject=new_user.email, expires_delta=access_token_expires)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        email=new_user.email,
    )


@router.post("/login", response_model=TokenResponse)
async def login_admin(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticates user and returns a signed JWT access token."""
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
    """Returns the authenticated user's profile."""
    return admin

