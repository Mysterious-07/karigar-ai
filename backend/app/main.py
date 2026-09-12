import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import artisans, products, buyers, stores, pricing, matching, public, enquiries, auth
from app.db.database import SessionLocal, engine
from app.db.models import Base
from app.db.seed_buyers import seed_demo_buyers
from app.services.ai_client import ai_client

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Startup event to ensure tables exist & seed demo buyers
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        seed_demo_buyers(db)
        db.close()
    except Exception as e:
        pass

# Configure CORS
origins = [origin.strip() for origin in settings.FRONTEND_URL.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist and mount static files
abs_upload_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), settings.UPLOAD_DIR))
os.makedirs(os.path.join(abs_upload_dir, "products"), exist_ok=True)
os.makedirs(os.path.join(abs_upload_dir, "artisans"), exist_ok=True)
os.makedirs(os.path.join(abs_upload_dir, "qr"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=abs_upload_dir), name="uploads")

# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# AI health check endpoint — verifies AI provider configuration and reachability
@app.get("/health/ai", tags=["Health"])
def ai_health_check():
    return ai_client.check_health()

# Include API routers under /api prefix
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(artisans.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(buyers.router, prefix=settings.API_V1_STR)
app.include_router(stores.router, prefix=settings.API_V1_STR)
app.include_router(pricing.router, prefix=settings.API_V1_STR)
app.include_router(matching.router, prefix=settings.API_V1_STR)
app.include_router(public.router, prefix=settings.API_V1_STR)
app.include_router(enquiries.router, prefix=settings.API_V1_STR)

