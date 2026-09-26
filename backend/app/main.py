import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.db.database import engine, Base
from app.api import auth, connectors, invoke, docs, stats, providers

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("universal_hub")

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Universal AI API Connector & Hub — Central platform for reusable AI API endpoints",
    version="1.0.0",
)


@app.on_event("startup")
async def startup_event():
    try:
        from app.seed import seed_database
        seed_database()
    except Exception as e:
        logger.error(f"Startup database seeding warning: {e}")

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handlers ensuring standard envelope
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats validation errors into the standard error envelope."""
    error_msgs = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid input")
        error_msgs.append(f"{loc}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "error": {
                "type": "validation_error",
                "message": "; ".join(error_msgs) if error_msgs else "Input validation failed.",
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catches all unhandled exceptions and hides raw server traces from external callers."""
    logger.error(f"Unhandled exception on {request.method} {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "error": {
                "type": "internal_error",
                "message": "An internal server error occurred. Please contact the administrator.",
            },
        },
    )


# Health Check
@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
    }


# Mount API Routes
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(connectors.router, prefix=settings.API_V1_STR)
app.include_router(invoke.router, prefix=settings.API_V1_STR)
app.include_router(docs.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)
