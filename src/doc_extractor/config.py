import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    INPUT_DIR = Path("data/input")
    OUTPUT_DIR = Path("data/output")