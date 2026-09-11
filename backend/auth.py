import os
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
import jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key_9931")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str: return pwd_context.hash(password)
def verify_password(plain, hashed) -> bool: return pwd_context.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
