import os
from dotenv import load_dotenv
from supabase import create_client
from fastapi import FastAPI

load_dotenv()
URL = os.getenv('SUPABASE_URL')
KEY = os.getenv('SUPABASE_KEY')

client = create_client(URL,KEY)
app = FastAPI()
@app.get("/health")
async def first_api():
    return {'status': 'ThinkTrace is running'}
@app.get("/universities")
async def get_uni():
    uni = client.table("Universities").select("*").execute()
    return uni.data