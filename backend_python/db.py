from pymongo import MongoClient
from mongoengine import connect
import os
from dotenv import load_dotenv

load_dotenv()

# Connect MongoClient for raw operations
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["osu-pp-benchmark-data"]
collection = db["scores"]

# Connect MongoEngine for ODM operations
connect("osu-pp-benchmark-data", host=os.getenv("MONGODB_URI"))
