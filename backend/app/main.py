import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from app.api import auth, documents, review, audit, dashboard
from app.database import engine, Base, SessionLocal
from app.config import settings
from app.logger import logger

# Create tables
Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database upon startup.")
    except Exception as e:
        logger.error(f"Failed to connect to the database upon startup: {e}")
        # We don't raise here to allow graceful failure handling, but in strict production you might raise.
    
    yield
    # Shutdown logic (if any)
    logger.info("Shutting down the application.")

app = FastAPI(title="Climitra Evidence Verification System API", lifespan=lifespan)

# Global Exception Handler for Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error for request {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": "Invalid request parameters", "details": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(review.router, prefix="/api/documents", tags=["review"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# Serve uploaded files
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to Climitra API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/health/db")
def health_check_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "database": "disconnected"}
        )

