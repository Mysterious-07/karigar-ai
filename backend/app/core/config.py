import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Karigar AI API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/karigar-ai"
    XAI_API_KEY: str = ""
    XAI_MODEL: str = "openai/gpt-oss-120b"
    XAI_BASE_URL: str = "https://api.groq.com/openai/v1"
    XAI_VISION_MODEL: str = ""  # Empty = no vision support; set to a vision model ID to enable image input
    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "uploads"

    # Buyer matching weights (must sum to 100)
    MATCH_CRAFT_WEIGHT: float = 30.0
    MATCH_CATEGORY_WEIGHT: float = 25.0
    MATCH_BUDGET_WEIGHT: float = 20.0
    MATCH_BUYER_TYPE_WEIGHT: float = 15.0
    MATCH_BULK_WEIGHT: float = 10.0
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
