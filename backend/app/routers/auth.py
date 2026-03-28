from fastapi import APIRouter,Body
from app.schemas import SignupRequest, LoginRequest
from app.database import client


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
