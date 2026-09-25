import json
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
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
    prefix="/api/skills",
    tags=["Skill Gap Analysis"]
)


# =========================================================
# SECURITY
# =========================================================


# =========================================================
# GET CURRENT STUDENT
# =========================================================

# =========================================================
# SKILL GAP ANALYSIS
# =========================================================

@router.post("/analyze")
async def analyze_skill_gap(
    student=Depends(get_current_student)
):

    # -----------------------------------------------------
    # 1. Get resume
    # -----------------------------------------------------

    resume = student.get("resume")

    if not resume:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please analyze your resume first. "
                "Your resume is required for skill gap analysis."
            )
        )

    # -----------------------------------------------------
    # 2. Get resume information
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

    previous_missing_skills = resume_analysis.get(
        "missing_skills",
        []
    )

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

    if not isinstance(student_skills, list):
        student_skills = []

    if not isinstance(previous_missing_skills, list):
        previous_missing_skills = []

    # -----------------------------------------------------
    # 3. Get target role
    # -----------------------------------------------------

    target_role = student.get(
        "target_role",
        "Software Engineer"
    )

    if not target_role:
        target_role = "Software Engineer"

    # -----------------------------------------------------
    # 4. Get latest job match
    # -----------------------------------------------------

    latest_job_match = student.get(
        "latest_job_match"
    )

    job_description = ""

    latest_job_analysis = {}

    if isinstance(latest_job_match, dict):

        job_description = latest_job_match.get(
            "job_description",
            ""
        )

        latest_job_analysis = latest_job_match.get(
            "analysis",
            {}
        )

        if not isinstance(latest_job_analysis, dict):
            latest_job_analysis = {}

    # -----------------------------------------------------
    # 5. Get Groq API key
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

        print("Groq initialization error:", error)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to initialize Groq: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 6. Limit resume
    # -----------------------------------------------------

    resume_text = resume_text[:12000]

    # -----------------------------------------------------
    # 7. AI system prompt
    # -----------------------------------------------------

    system_prompt = """
You are an expert career advisor and technical learning strategist.

Analyze a student's resume and identify the most important
skills they need to develop for their target software role.

Use the student's actual resume as the source of their current skills.

If a job description is provided, use it to identify job-specific gaps.

Return ONLY valid JSON.

Use exactly this structure:

{
  "target_role": "",
  "current_skills": [
    {
      "skill": "",
      "level": "Beginner|Intermediate|Strong"
    }
  ],
  "skill_gaps": [
    {
      "skill": "",
      "priority": "High|Medium|Low",
      "reason": "",
      "suggested_action": ""
    }
  ],
  "roadmap": [
    {
      "week": 1,
      "focus": "",
      "topics": [],
      "tasks": [],
      "outcome": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "description": "",
      "skills": []
    }
  ],
  "interview_topics": [],
  "overall_summary": ""
}

RULES:

1. Do not invent skills that are present in the resume.

2. Current skills must be based only on the resume.

3. Do not claim that the student is experienced with a
technology unless the resume supports it.

4. Skill gaps should be practical and relevant to the
target role.

5. If a job description is available, prioritize gaps
that are important for that job.

6. Priority:
   - High = important for the target role or job
   - Medium = useful supporting skill
   - Low = optional enhancement

7. Suggested actions must be specific.

8. Roadmap should contain 4 to 6 weeks.

9. Each week should contain practical topics and tasks.

10. Projects should be realistic for a student or fresher.

11. Interview topics should focus on concepts the student
should prepare based on their target role and gaps.

12. Keep responses concise but useful.

13. Return valid JSON only.

14. Do not use markdown code fences.
"""

    # -----------------------------------------------------
    # 8. AI user prompt
    # -----------------------------------------------------

    user_prompt = f"""
TARGET ROLE
===========

{target_role}


STUDENT RESUME
==============

{resume_text}


SKILLS IDENTIFIED FROM RESUME
=============================

{json.dumps(student_skills)}


PREVIOUS RESUME SKILL GAPS
==========================

{json.dumps(previous_missing_skills)}


LATEST JOB DESCRIPTION
======================

{job_description}


LATEST JOB MATCH ANALYSIS
=========================

{json.dumps(latest_job_analysis)}
"""

    # -----------------------------------------------------
    # 9. Call Groq
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
        print("SKILL GAP GROQ ERROR")
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
    # 10. Read response
    # -----------------------------------------------------

    try:

        content = response.choices[0].message.content

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Invalid Groq response: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    if not content:

        raise HTTPException(
            status_code=500,
            detail="Groq returned an empty response."
        )

    # -----------------------------------------------------
    # 11. Parse JSON
    # -----------------------------------------------------

    try:

        analysis = json.loads(content)

    except json.JSONDecodeError as error:

        print()
        print("==========================================")
        print("INVALID JSON FROM GROQ")
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
    # 12. Validate structure
    # -----------------------------------------------------

    if not isinstance(analysis, dict):
        raise HTTPException(
            status_code=500,
            detail="Groq returned an invalid analysis structure."
        )

    # -----------------------------------------------------
    # Target role
    # -----------------------------------------------------

    if not isinstance(
        analysis.get("target_role"),
        str
    ):
        analysis["target_role"] = target_role

    # -----------------------------------------------------
    # Arrays
    # -----------------------------------------------------

    array_fields = [
        "current_skills",
        "skill_gaps",
        "roadmap",
        "projects",
        "interview_topics"
    ]

    for field in array_fields:

        if not isinstance(
            analysis.get(field),
            list
        ):
            analysis[field] = []

    # -----------------------------------------------------
    # Overall summary
    # -----------------------------------------------------

    if not isinstance(
        analysis.get("overall_summary"),
        str
    ):
        analysis["overall_summary"] = (
            "Skill gap analysis completed."
        )

    # -----------------------------------------------------
    # 13. Save analysis
    # -----------------------------------------------------

    skill_gap_record = {
        "target_role": target_role,
        "created_at": datetime.now(timezone.utc),
        "analysis": analysis
    }

    try:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$set": {
                    "latest_skill_gap_analysis": skill_gap_record
                }
            }
        )

    except Exception as error:

        print()
        print("==========================================")
        print("SKILL GAP MONGODB ERROR")
        print("ERROR TYPE:", type(error).__name__)
        print("ERROR:", str(error))
        print("==========================================")
        print()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save skill gap analysis: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    # -----------------------------------------------------
    # 14. Return
    # -----------------------------------------------------

    return {
        "message": "Skill gap analysis completed successfully",
        "analysis": analysis
    }


# =========================================================
# GET LATEST SKILL GAP ANALYSIS
# =========================================================

@router.get("/latest")
async def get_latest_skill_gap(
    student=Depends(get_current_student)
):

    latest = student.get(
        "latest_skill_gap_analysis"
    )

    if not latest:
        return {
            "exists": False,
            "analysis": None
        }

    created_at = latest.get(
        "created_at"
    )

    if created_at and hasattr(
        created_at,
        "isoformat"
    ):
        created_at = created_at.isoformat()

    return {
        "exists": True,
        "created_at": created_at,
        "analysis": latest.get(
            "analysis",
            {}
        )
    }