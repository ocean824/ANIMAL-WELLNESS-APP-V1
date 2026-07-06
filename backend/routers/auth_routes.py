"""Auth routes: register, login, logout, me, forgot/reset/change password."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from auth_utils import (client_ip, create_token, get_current_user, hash_password,
                        rate_limit, verify_password)
from database import audit, create_record, db, now_iso, sanitize_user, update_record
from models import (ChangePasswordInput, ForgotPasswordInput, LoginInput,
                    RegisterInput, ResetPasswordInput)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterInput, request: Request):
    rate_limit(f"register:{client_ip(request)}", 10)
    existing = await db.users.find_one({"email": body.email.lower(), "deletedAt": None})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = await create_record("users", {
        "email": body.email.lower(),
        "passwordHash": hash_password(body.password),
        "name": body.name,
        "role": "owner",
        "isActive": True,
        "lastLoginAt": now_iso(),
    })
    await create_record("notifications", {
        "userId": user["id"],
        "title": "Welcome to Soula Paws",
        "body": "Start gently: add your pet, complete a 30-second check-in, and try the 5-minute calm connection ritual.",
        "readAt": None,
    })
    await audit("auth.register", "users", user["id"], user["id"])
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": sanitize_user(user)}


@router.post("/login")
async def login(body: LoginInput, request: Request):
    rate_limit(f"login:{client_ip(request)}", 15)
    user = await db.users.find_one({"email": body.email.lower(), "deletedAt": None}, {"_id": 0})
    if not user or not verify_password(body.password, user.get("passwordHash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.get("isActive", True):
        raise HTTPException(status_code=403, detail="This account has been disabled. Contact support.")
    await update_record("users", user["id"], {"lastLoginAt": now_iso()})
    await audit("auth.login", "users", user["id"], user["id"])
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": sanitize_user(user)}


@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    await audit("auth.logout", "users", user["id"], user["id"])
    return {"message": "Logged out."}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return sanitize_user(user)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordInput, request: Request):
    rate_limit(f"forgot:{client_ip(request)}", 5)
    user = await db.users.find_one({"email": body.email.lower(), "deletedAt": None}, {"_id": 0})
    dev_token = None
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        await create_record("passwordResetTokens", {
            "userId": user["id"],
            "tokenHash": token_hash,
            "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "usedAt": None,
        })
        await audit("auth.forgot_password", "users", user["id"], user["id"])
        # Dev mode: no email service configured -> return reset token directly (docs: 'send email or log link in dev mode')
        dev_token = raw_token
    return {
        "message": "If an account exists for that email, a reset link has been sent.",
        "devMode": True,
        "devResetToken": dev_token,
    }


@router.post("/reset-password")
async def reset_password(body: ResetPasswordInput, request: Request):
    rate_limit(f"reset:{client_ip(request)}", 10)
    token_hash = hashlib.sha256(body.token.encode()).hexdigest()
    record = await db.passwordResetTokens.find_one({"tokenHash": token_hash, "usedAt": None, "deletedAt": None}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="This reset link is invalid or was already used.")
    if record["expiresAt"] < now_iso():
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")
    await update_record("users", record["userId"], {"passwordHash": hash_password(body.password)})
    await update_record("passwordResetTokens", record["id"], {"usedAt": now_iso()})
    await audit("auth.password_reset", "users", record["userId"], record["userId"])
    return {"message": "Password reset successfully. You can now log in."}


@router.post("/change-password")
async def change_password(body: ChangePasswordInput, user=Depends(get_current_user)):
    full_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not verify_password(body.currentPassword, full_user.get("passwordHash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    await update_record("users", user["id"], {"passwordHash": hash_password(body.newPassword)})
    await audit("auth.change_password", "users", user["id"], user["id"])
    return {"message": "Password changed successfully."}
