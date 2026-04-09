from fastapi import APIRouter, Security, HTTPException
from app.schemas import SignupRequest, LoginRequest
from app.database import client
from app.dependencies import get_current_user

router = APIRouter()


@router.post('/signup')
async def signup(body: SignupRequest):
    try:
        response = client.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        if not response.user:
            raise HTTPException(status_code=400, detail="Signup failed. Please try again.")

        user_id = response.user.id
        client.table("Users").insert({
            "id": user_id,
            "first_name": body.first_name,
            "last_name": body.last_name,
            "role": body.role,
            "email": body.email,
        }).execute()

        return {"message": "Account created successfully"}

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        print(f"Signup error: {err}")
        if "already registered" in err.lower() or "already exists" in err.lower() or "duplicate" in err.lower():
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail="Signup failed. Please try again.")


@router.post('/login')
async def login(body: LoginRequest):
    try:
        response = client.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        return response.session.access_token

    except Exception as e:
        err = str(e)
        print(f"Login error: {err}")
        if (
            "invalid login credentials" in err.lower()
            or "invalid" in err.lower()
            or "credentials" in err.lower()
            or "400" in err
        ):
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.get('/me')
async def get_me(current_user=Security(get_current_user)):
    return current_user