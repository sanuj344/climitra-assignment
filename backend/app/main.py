from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, documents, review, audit, dashboard
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Climitra Evidence Verification System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(review.router, prefix="/api/documents", tags=["review"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Climitra API"}
