from fastapi import APIRouter,Depends
from app.schemas import SignupRequest, LoginRequest
from app.database import client
from app.dependencies import get_current_user, security
from fastapi.security import HTTPBearer
from fastapi import Security


router = APIRouter()



@router.post('/signup')

async def signup(body: SignupRequest ):
    response = client.auth.sign_up({
        "email": body.email,
        "password": body.password
    })
    user_id = response.user.id
    client.table("Users").insert({
        'id':user_id, 
        'first_name':body.first_name, 
        'last_name': body.last_name,
        'role': body.role,
        'email': body.email}).execute()
@router.post('/login')

async def login(body: LoginRequest):
    response = client.auth.sign_in_with_password({
        'email':body.email,
        'password':body.password
    })
    return response.session.access_token
@router.get('/me')
async def get_me(current_user =Security(get_current_user)):
    return current_user