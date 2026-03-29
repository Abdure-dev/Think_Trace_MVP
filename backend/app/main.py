
from fastapi import FastAPI
from app.routers import auth
from app.database import client
from fastapi.security import HTTPBearer
from app.routers import courses
from app.routers import assignments
from app.routers import traces
security = HTTPBearer()
app = FastAPI(
    title = "ThinkTrace API",
    version="0.1.0",
    swagger_ui_parameters={"persistAuthorization":True}
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(assignments.router)
app.include_router(traces.router)
@app.get("/health")
async def first_api():
    return {'status': 'ThinkTrace is running'}
@app.get("/universities")
async def get_uni():
    uni = client.table("Universities").select("*").execute()
    return uni.data