from fastapi import Header, HTTPException
from app.database import client
from fastapi.security import HTTPBearer
from fastapi import Security

security = HTTPBearer()

async def get_current_user(authorization = Security(security)):
    token = authorization.credentials
    
    try:
        user = client.auth.get_user(token)
        profile = client.table("Users").select("first_name","last_name","email","id","role","university_id").eq("id",user.user.id).execute()
        return profile.data[0]
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401,detail=str(e))