import os
from dotenv import load_dotenv
from supabase import create_client
load_dotenv()
URL = os.getenv('SUPABASE_URL')
KEY = os.getenv('SUPABASE_KEY')

client = create_client(URL,KEY)