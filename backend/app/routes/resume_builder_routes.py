import json
import os
import re
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

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b"
)

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is not set in .env"
    )


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/resume-builder",
    tags=["Resume Builder"]
)

groq_client = Groq(
    api_key=GROQ_API_KEY
)


# =========================================================
# HELPERS
# =========================================================

def clean_string(value):
    if value is None:
        return ""

    return str(value).strip()


def clean_list(value):
    if isinstance(value, list):
        return [
            clean_string(item)
            for item in value
            if clean_string(item)
        ]

    if isinstance(value, str):
        value = value.strip()

        if value:
            return [value]

    return []


def parse_json_response(content):
    if not content:
        return {}

    cleaned = str(content).strip()

    cleaned = cleaned.replace(
        "```json",
        ""
    )

    cleaned = cleaned.replace(
        "```",
        ""
    )

    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    match = re.search(
        r"\{.*\}",
        cleaned,
        re.DOTALL
    )

    if match:
        try:
            return json.loads(
                match.group(0)
            )
        except Exception:
            pass

    return {}


def normalize_array(value):
    if not isinstance(value, list):
        return []

    cleaned = []

    for item in value:
        if isinstance(item, dict):
            cleaned.append(item)

    return cleaned


def normalize_generated_resume(data):

    if not isinstance(data, dict):
        data = {}

    personal = data.get(
        "personal",
        {}
    )

    if not isinstance(personal, dict):
        personal = {}

    return {

        "professional_summary":
            clean_string(
                data.get(
                    "professional_summary",
                    ""
                )
            ),

        "personal": {

            "name":
                clean_string(
                    personal.get(
                        "name",
                        ""
                    )
                ),

            "email":
                clean_string(
                    personal.get(
                        "email",
                        ""
                    )
                ),

            "phone":
                clean_string(
                    personal.get(
                        "phone",
                        ""
                    )
                ),

            "location":
                clean_string(
                    personal.get(
                        "location",
                        ""
                    )
                ),

            "linkedin":
                clean_string(
                    personal.get(
                        "linkedin",
                        ""
                    )
                ),

            "github":
                clean_string(
                    personal.get(
                        "github",
                        ""
                    )
                ),

            "portfolio":
                clean_string(
                    personal.get(
                        "portfolio",
                        ""
                    )
                )
        },

        "education":
            normalize_array(
                data.get(
                    "education",
                    []
                )
            ),

        "experience":
            normalize_array(
                data.get(
                    "experience",
                    []
                )
            ),

        "internships":
            normalize_array(
                data.get(
                    "internships",
                    []
                )
            ),

        "skills":
            clean_list(
                data.get(
                    "skills",
                    []
                )
            ),

        "projects":
            normalize_array(
                data.get(
                    "projects",
                    []
                )
            ),

        "certifications":
            normalize_array(
                data.get(
                    "certifications",
                    []
                )
            ),

        "achievements":
            normalize_array(
                data.get(
                    "achievements",
                    []
                )
            )
    }


# =========================================================
# GENERATE RESUME
# =========================================================

@router.post("/generate")
async def generate_resume(
    data: dict,
    student=Depends(get_current_student)
):

    try:

        print("\n")
        print("=" * 70)
        print("ATS RESUME BUILDER - GENERATE")
        print("=" * 70)

        print(
            "Student:",
            student.get(
                "email",
                "unknown"
            )
        )

        # -------------------------------------------------
        # REQUEST VALUES
        # -------------------------------------------------

        source = clean_string(
            data.get(
                "source",
                "previous"
            )
        ).lower()

        template = clean_string(
            data.get(
                "template",
                "minimal"
            )
        )

        target_role = clean_string(
            data.get(
                "target_role",
                student.get(
                    "target_role",
                    ""
                )
            )
        )

        print(
            "Source:",
            source
        )

        print(
            "Template:",
            template
        )

        print(
            "Target role:",
            target_role
        )

        # =================================================
        # PREVIOUS RESUME MODE
        # =================================================

        if source == "previous":

            print(
                "Fetching LATEST analyzed resume "
                "directly from MongoDB..."
            )

            current_student = (
                await students_collection.find_one(
                    {
                        "_id": student["_id"]
                    }
                )
            )

            if not current_student:

                raise HTTPException(
                    status_code=404,
                    detail="Student account not found."
                )

            latest_resume = (
                current_student.get(
                    "resume"
                )
            )

            if not latest_resume:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "No analyzed resume found. "
                        "Please analyze a resume first."
                    )
                )

            resume_text = clean_string(
                latest_resume.get(
                    "resume_text",
                    ""
                )
            )

            filename = clean_string(
                latest_resume.get(
                    "filename",
                    ""
                )
            )

            analysis = latest_resume.get(
                "analysis",
                {}
            )

            if not isinstance(
                analysis,
                dict
            ):
                analysis = {}

            if not resume_text:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Latest analyzed resume "
                        "contains no readable text."
                    )
                )

            print(
                "Latest filename:",
                filename
            )

            print(
                "Resume characters:",
                len(resume_text)
            )

            print(
                "ATS score:",
                analysis.get(
                    "ats_score",
                    0
                )
            )

            # =================================================
            # PROMPT
            # =================================================

            prompt = f"""
You are a professional ATS resume builder.

The user has uploaded a resume and the Resume Analyzer
has already analyzed it.

Create an UPDATED ATS-friendly resume using the
LATEST resume text and LATEST analysis.

TARGET ROLE:
{target_role}

STRICT RULES:

1. Never invent information.
2. Never invent education.
3. Never invent marks.
4. Never invent CGPA.
5. Never invent percentages.
6. Never invent internships.
7. Never invent work experience.
8. Never invent employers.
9. Never invent job titles.
10. Never invent projects.
11. Never invent certifications.
12. Never invent achievements.
13. Never invent skills.
14. Never invent technologies.
15. Never invent dates.
16. Never invent URLs.
17. Never invent contact information.
18. Preserve the factual meaning of the original resume.
19. Improve grammar and professional wording.
20. Improve ATS readability.
21. Use the ATS analysis to improve the presentation.
22. Missing skills are suggestions only. Do not claim the
    student has a missing skill.
23. Keep all factual information from the original resume.
24. Do not add information that is not supported by the
    original resume.
25. Keep the resume suitable for a fresher/student.
26. Return JSON only.
27. Do not return markdown.
28. Do not add explanations outside the JSON.

LATEST RESUME TEXT
==================

{resume_text}


LATEST ATS ANALYSIS
===================

{json.dumps(
    analysis,
    ensure_ascii=False,
    indent=2
)}


RETURN EXACTLY THIS STRUCTURE:

{{
    "professional_summary": "",

    "personal": {{
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": "",
        "portfolio": ""
    }},

    "education": [],

    "experience": [],

    "internships": [],

    "skills": [],

    "projects": [],

    "certifications": [],

    "achievements": []
}}

Use arrays for all repeated sections.

Example education object:

{{
    "degree": "",
    "institution": "",
    "location": "",
    "year": "",
    "cgpa": "",
    "percentage": ""
}}

Example experience object:

{{
    "title": "",
    "company": "",
    "location": "",
    "duration": "",
    "description": []
}}

Example internship object:

{{
    "title": "",
    "company": "",
    "location": "",
    "duration": "",
    "description": []
}}

Example project object:

{{
    "title": "",
    "technologies": [],
    "description": [],
    "url": ""
}}

Example certification:

{{
    "title": "",
    "issuer": "",
    "year": "",
    "url": ""
}}

Example achievement:

{{
    "title": "",
    "issuer": "",
    "year": "",
    "url": ""
}}
"""

        # =================================================
        # MANUAL MODE
        # =================================================

        else:

            resume_data = data.get(
                "resume_data",
                {}
            )

            if not isinstance(
                resume_data,
                dict
            ):
                resume_data = {}

            name = clean_string(
                resume_data.get(
                    "name",
                    ""
                )
            )

            if not name:

                raise HTTPException(
                    status_code=400,
                    detail="Name is required."
                )

            prompt = f"""
You are a professional ATS resume builder.

Create a professional ATS-friendly student resume.

TARGET ROLE:
{target_role}

IMPORTANT:

- Never invent information.
- Use only information supplied below.
- Do not invent education.
- Do not invent marks.
- Do not invent experience.
- Do not invent internships.
- Do not invent projects.
- Do not invent certifications.
- Do not invent achievements.
- Do not invent skills.
- Do not invent technologies.
- Do not invent dates.
- Do not invent URLs.
- Improve grammar and wording only.
- Keep factual meaning unchanged.
- Return JSON only.

USER DATA:

{json.dumps(
    resume_data,
    ensure_ascii=False,
    indent=2
)}


Return exactly:

{{
    "professional_summary": "",

    "personal": {{
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": "",
        "portfolio": ""
    }},

    "education": [],

    "experience": [],

    "internships": [],

    "skills": [],

    "projects": [],

    "certifications": [],

    "achievements": []
}}
"""

        # =================================================
        # CALL GROQ
        # =================================================

        print(
            "Sending request to Groq..."
        )

        try:

            response = (
                groq_client
                .chat
                .completions
                .create(

                    model=GROQ_MODEL,

                    messages=[

                        {
                            "role": "system",
                            "content": (
                                "You are an ATS resume builder. "
                                "Never invent facts. "
                                "Return JSON only."
                            )
                        },

                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],

                    response_format={
                        "type": "json_object"
                    },

                    temperature=0.1,

                    max_completion_tokens=4096
                )
            )

        except Exception as error:

            print(
                "GROQ API ERROR:",
                repr(error)
            )

            raise HTTPException(
                status_code=502,
                detail="Groq resume generation failed."
            )

        # =================================================
        # EXTRACT CONTENT
        # =================================================

        try:

            content = (
                response
                .choices[0]
                .message
                .content
            )

        except Exception as error:

            print(
                "GROQ RESPONSE ERROR:",
                repr(error)
            )

            raise HTTPException(
                status_code=502,
                detail="Invalid response received from AI."
            )

        if not content:

            print(
                "Groq returned empty content."
            )

            raise HTTPException(
                status_code=502,
                detail="AI returned an empty resume."
            )

        print(
            "Groq returned response length:",
            len(content)
        )

        # =================================================
        # PARSE
        # =================================================

        generated_content = parse_json_response(
            content
        )

        if not generated_content:

            print(
                "INVALID GROQ RESPONSE:"
            )

            print(
                content
            )

            raise HTTPException(
                status_code=502,
                detail="AI returned an invalid resume."
            )

        # =================================================
        # NORMALIZE
        # =================================================

        generated_content = (
            normalize_generated_resume(
                generated_content
            )
        )

        # =================================================
        # CHECK NAME
        # =================================================

        generated_name = clean_string(
            generated_content
            .get("personal", {})
            .get("name", "")
        )

        print(
            "Generated name:",
            generated_name
        )

        # =================================================
        # SAVE
        # =================================================

        generated_resume = {

            "source": source,

            "template": template,

            "target_role": target_role,

            "generated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "generated_content":
                generated_content
        }

        if source == "previous":

            generated_resume[
                "source_resume_filename"
            ] = filename

        await students_collection.update_one(

            {
                "_id": student["_id"]
            },

            {
                "$set": {
                    "latest_generated_resume":
                        generated_resume
                }
            }
        )

        print(
            "Generated resume saved."
        )

        print("=" * 70)
        print(
            "GENERATE SUCCESS"
        )
        print("=" * 70)

        return {

            "success": True,

            "message":
                "Resume generated successfully.",

            "resume":
                generated_resume
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "RESUME BUILDER ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate resume."
        )


# =========================================================
# GET LATEST GENERATED RESUME
# =========================================================

@router.get("/latest")
async def get_latest_generated_resume(
    student=Depends(get_current_student)
):

    return {

        "success": True,

        "resume":
            student.get(
                "latest_generated_resume"
            )
    }


# =========================================================
# SAVE RESUME
# =========================================================

@router.put("/save")
async def save_resume(
    data: dict,
    student=Depends(get_current_student)
):

    try:

        generated_content = data.get(
            "generated_content",
            {}
        )

        if not isinstance(
            generated_content,
            dict
        ):
            generated_content = {}

        document = {

            "source": clean_string(
                data.get(
                    "source",
                    "manual"
                )
            ),

            "template": clean_string(
                data.get(
                    "template",
                    "minimal"
                )
            ),

            "target_role": clean_string(
                data.get(
                    "target_role",
                    student.get(
                        "target_role",
                        ""
                    )
                )
            ),

            "generated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "generated_content":
                generated_content
        }

        await students_collection.update_one(

            {
                "_id": student["_id"]
            },

            {
                "$set": {
                    "latest_generated_resume":
                        document
                }
            }
        )

        print(
            "Resume saved successfully."
        )

        return {

            "success": True,

            "message":
                "Resume saved successfully.",

            "resume":
                document
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "SAVE RESUME ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to save resume."
        )