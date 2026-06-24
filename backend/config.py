"""
Application configuration - loads environment variables using python-dotenv.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Security
SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# External APIs
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
