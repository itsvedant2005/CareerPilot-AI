import json
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from groq import Groq

from app.auth import get_current_student
from app.database import students_collection


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/jobs",
    tags=["Job Matcher"]
)


# =========================================================
# SECURITY
# =========================================================


# =========================================================
# REQUEST MODEL
# =========================================================

class JobMatchRequest(BaseModel):
    job_description: str


# =========================================================
# GET CURRENT LOGGED-IN STUDENT
# =========================================================

# =========================================================
# JOB MATCHER
# =========================================================

@router.post("/match")
async def match_job(
    request: JobMatchRequest,
    student=Depends(get_current_student)
):

    # -----------------------------------------------------
    # 1. Validate job description
    # -----------------------------------------------------

    job_description = request.job_description.strip()

    if not job_description:
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty."
        )

    if len(job_description) < 30:
        raise HTTPException(
            status_code=400,
            detail="Please provide a more detailed job description."
        )

    # -----------------------------------------------------
    # 2. Get stored resume
    # -----------------------------------------------------

    resume = student.get("resume")

    if not resume:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please analyze your resume first. "
                "Your resume is required for personalized job matching."
            )
        )

    # -----------------------------------------------------
    # 3. Get resume data
    # -----------------------------------------------------

    resume_text = resume.get(
        "resume_text",
        ""
    )

    resume_analysis = resume.get(
        "analysis",
        {}
    )

    student_skills = resume_analysis.get(
        "skills",
        []
    )

    student_missing_skills = resume_analysis.get(
        "missing_skills",
        []
    )

    # -----------------------------------------------------
    # 4. Validate stored resume
    # -----------------------------------------------------

    if not isinstance(resume_text, str):
        resume_text = str(resume_text)

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "Your stored resume does not contain readable text. "
                "Please upload and analyze your resume again."
            )
        )

    # -----------------------------------------------------
    # 5. Make sure skills are lists
    # -----------------------------------------------------

    if not isinstance(student_skills, list):
        student_skills = []

    if not isinstance(student_missing_skills, list):
        student_missing_skills = []

    # -----------------------------------------------------
    # 6. Groq API
    # -----------------------------------------------------

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured."
        )

    try:
        client = Groq(
            api_key=api_key
        )

    except Exception as error:
        print("Groq client error:", error)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to initialize Groq: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 7. Limit resume text
    # -----------------------------------------------------

    resume_text = resume_text[:12000]

    # -----------------------------------------------------
    # 8. AI system prompt
    # -----------------------------------------------------

    system_prompt = """
You are a technical recruiter.

Compare the student's resume with the job description.

Return ONLY valid JSON.

Use exactly this structure:

{
  "match_score": 0,
  "role": "",
  "matched_skills": [],
  "missing_skills": [],
  "important_keywords": [],
  "experience_requirements": [],
  "recommendations": [],
  "summary": ""
}

Rules:
- match_score must be an integer from 0 to 100.
- matched_skills must be supported by the resume and relevant to the job.
- missing_skills must be important job requirements not demonstrated in the resume.
- Do not invent skills, experience, education, projects, or certifications.
- important_keywords must come from the job description.
- experience_requirements must contain important eligibility and responsibility requirements.
- recommendations must be practical and personalized.
- Keep every list concise.
- Keep summary under 80 words.
- Return valid JSON only.
"""

    # -----------------------------------------------------
    # 9. AI user prompt
    # -----------------------------------------------------

    user_prompt = f"""
STUDENT RESUME
==============

{resume_text}


STUDENT SKILLS IDENTIFIED FROM RESUME
=====================================

{json.dumps(student_skills)}


PREVIOUSLY IDENTIFIED SKILL GAPS
================================

{json.dumps(student_missing_skills)}


JOB DESCRIPTION
===============

{job_description}
"""

    # -----------------------------------------------------
    # 10. Call Groq
    # -----------------------------------------------------

    try:

        response = client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": user_prompt
        }
    ],
    response_format={
        "type": "json_object"
    },
    reasoning_effort="low",
    include_reasoning=False,
    max_completion_tokens=4096,
    temperature=0.2
)

    except Exception as error:

        print()
        print("==========================================")
        print("JOB MATCHER - GROQ ERROR")
        print("ERROR TYPE:", type(error).__name__)
        print("ERROR:", str(error))
        print("==========================================")
        print()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Groq Error: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 11. Read Groq response
    # -----------------------------------------------------

    try:

        content = response.choices[0].message.content

    except Exception as error:

        print("Groq response error:", error)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Invalid Groq response: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 12. Empty response
    # -----------------------------------------------------

    if not content:

        raise HTTPException(
            status_code=500,
            detail="Groq returned an empty response."
        )

    # -----------------------------------------------------
    # 13. Parse JSON
    # -----------------------------------------------------

    try:

        analysis = json.loads(content)

    except json.JSONDecodeError as error:

        print()
        print("==========================================")
        print("INVALID JSON RETURNED BY GROQ")
        print(content)
        print("==========================================")
        print()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Groq returned invalid JSON: "
                f"{str(error)}"
            )
        )

    # -----------------------------------------------------
    # 14. Validate match score
    # -----------------------------------------------------

    try:

        score = int(
            analysis.get(
                "match_score",
                0
            )
        )

    except (TypeError, ValueError):

        score = 0

    score = max(
        0,
        min(100, score)
    )

    analysis["match_score"] = score

    # -----------------------------------------------------
    # 15. Make sure expected arrays exist
    # -----------------------------------------------------

    list_fields = [
        "matched_skills",
        "missing_skills",
        "important_keywords",
        "experience_requirements",
        "recommendations"
    ]

    for field in list_fields:

        if not isinstance(
            analysis.get(field),
            list
        ):
            analysis[field] = []

    # -----------------------------------------------------
    # 16. Make sure strings exist
    # -----------------------------------------------------

    if not isinstance(
        analysis.get("role"),
        str
    ):
        analysis["role"] = "Software Engineer"

    if not isinstance(
        analysis.get("summary"),
        str
    ):
        analysis["summary"] = (
            "Job matching analysis completed."
        )

    # -----------------------------------------------------
    # 17. Create job match history object
    # -----------------------------------------------------

    matched_at = datetime.now(
        timezone.utc
    )

    job_match = {
        "job_description": job_description,
        "analysis": analysis,
        "matched_at": matched_at
    }

    # -----------------------------------------------------
    # 18. Save to MongoDB
    # -----------------------------------------------------

    try:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$push": {
                    "job_matches": job_match
                },
                "$set": {
                    "latest_job_match": job_match
                }
            }
        )

    except Exception as error:

        print()
        print("==========================================")
        print("JOB MATCHER - MONGODB SAVE ERROR")
        print("ERROR TYPE:", type(error).__name__)
        print("ERROR:", str(error))
        print("==========================================")
        print()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save job match: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 19. Return response
    # -----------------------------------------------------

    return {
        "message": "Job matched successfully",
        "analysis": analysis
    }


# =========================================================
# JOB MATCH HISTORY
# =========================================================

@router.get("/history")
async def get_job_match_history(
    student=Depends(get_current_student)
):

    # -----------------------------------------------------
    # 1. Get saved job matches
    # -----------------------------------------------------

    job_matches = student.get(
        "job_matches",
        []
    )

    if not isinstance(job_matches, list):
        job_matches = []

    # -----------------------------------------------------
    # 2. Prepare response
    # -----------------------------------------------------

    history = []

    for match in job_matches:

        if not isinstance(match, dict):
            continue

        analysis = match.get(
            "analysis",
            {}
        )

        if not isinstance(analysis, dict):
            analysis = {}

        matched_at = match.get(
            "matched_at"
        )

        if matched_at:

            if hasattr(
                matched_at,
                "isoformat"
            ):
                matched_at = matched_at.isoformat()

            else:
                matched_at = str(
                    matched_at
                )

        history.append(
            {
                "job_description": match.get(
                    "job_description",
                    ""
                ),
                "matched_at": matched_at,
                "analysis": analysis
            }
        )

    # -----------------------------------------------------
    # 3. Newest match first
    # -----------------------------------------------------

    history.reverse()

    # -----------------------------------------------------
    # 4. Return history
    # -----------------------------------------------------

    return {
        "count": len(history),
        "history": history
    }