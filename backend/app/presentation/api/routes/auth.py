from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from app.presentation.schemas.auth import UserCreate, UserLogin, TokenResponse, ForgotPasswordRequest
from app.infrastructure.external.supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
def signup(user_data: UserCreate):
    try:
        res = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "first_name": user_data.first_name,
                    "last_name": user_data.last_name,
                }
            }
        })
        
        if not res.session:
            # Email confirmation is required — return a success JSON (not an error)
            return JSONResponse(
                status_code=200,
                content={"message": "Signup successful. Please check your email for confirmation.", "email_confirmation_required": True}
            )
            
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

@router.post("/logout")
def logout():
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    try:
        supabase.auth.reset_password_email(req.email)
        return {"message": "Password reset email sent if the account exists."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
