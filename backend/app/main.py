from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router
from app.routes.job_routes import router as job_router
from app.routes.skill_routes import router as skill_router
from app.routes.interview_routes import router as interview_router
from app.routes.resume_builder_routes import router as resume_builder_router
from app.routes.aptitude_routes import (
 router as aptitude_router
)
from app.routes.coding_routes import router as coding_router

app = FastAPI(
    title="CareerPilot-AI",
    description="AI-powered placement preparation platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "https://vedant-careerpilot-ai.onrender.com",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(job_router)
app.include_router(skill_router)
app.include_router(interview_router)
app.include_router(resume_builder_router)
app.include_router(aptitude_router)
app.include_router(coding_router)

@app.get("/")
def home():

    return {
        "message": "CareerPilot-AI Backend is running!",
        "status": "success"
    }


@app.get("/api/health")
def health_check():

    return {
        "status": "healthy",
        "service": "CareerPilot-AI"
    }