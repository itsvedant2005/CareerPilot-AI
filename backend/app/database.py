import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is not set in .env")

client = AsyncIOMotorClient(MONGO_URI)

database = client["careerpilot_ai"]

students_collection = database["students"]