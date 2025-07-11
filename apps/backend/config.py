from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Mistral API Configuration
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")

    # Application Settings
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Storage Configuration
    UPLOAD_DIR: Path = Path("data/input")
    OUTPUT_DIR: Path = Path("data/output")
    
    # File Configuration
    MAX_FILE_SIZE: int = 10  # in MB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Validate required settings
if not settings.MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable is not set")