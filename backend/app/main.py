
from fastapi import FastAPI
from app.routers import auth
from app.database import client

app = FastAPI()
app.include_router(auth.router)
@app.get("/health")
async def first_api():
    return {'status': 'ThinkTrace is running'}
@app.get("/universities")
async def get_uni():
    uni = client.table("Universities").select("*").execute()
    return uni.data