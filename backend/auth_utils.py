"""JWT auth, password hashing, RBAC dependencies, and a lightweight rate limiter."""
import os
import time
from collections import defaultdict
from typing import Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, Request

from database import db

JWT_SECRET = os.environ.get("JWT_SECRET", "soula-paws-dev-secret")
JWT_ALG = "HS256"
JWT_EXPIRES_SECONDS = 7 * 24 * 3600


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {"sub": user_id, "role": role, "iat": int(time.time()), "exp": int(time.time()) + JWT_EXPIRES_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    user = await db.users.find_one({"id": payload.get("sub"), "deletedAt": None}, {"_id": 0})
    if not user or not user.get("isActive", True):
        raise HTTPException(status_code=401, detail="Account not found or disabled.")
    return user


async def require_admin(user: Dict = Depends(get_current_user)) -> Dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


# ---------- lightweight in-memory rate limiter ----------
_buckets: Dict[str, list] = defaultdict(list)


def rate_limit(key: str, max_calls: int, window_seconds: int = 60):
    now = time.time()
    bucket = _buckets[key]
    _buckets[key] = [t for t in bucket if now - t < window_seconds]
    if len(_buckets[key]) >= max_calls:
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down and try again shortly.")
    _buckets[key].append(now)


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
