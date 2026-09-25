import json
import os
import re
from datetime import datetime, timezone
from io import BytesIO

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from groq import Groq
from PyPDF2 import PdfReader
from docx import Document

load_dotenv()

router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)

security = HTTPBearer(auto_error=False)

# =========================================================
# ENVIRONMENT
# =========================================================

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError(
        "MONGO_URI is not set in .env"
    )

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "careerpilot_ai_secret",
)

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256",
)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is not set in .env"
    )

# =========================================================
# DATABASE
# =========================================================

client = AsyncIOMotorClient(
    MONGO_URI
)

database = client["careerpilot_ai"]

students_collection = database[
    "students"
]

# =========================================================
# GROQ
# =========================================================

groq_client = Groq(
    api_key=GROQ_API_KEY
)

# =========================================================
# AUTHENTICATION
# =========================================================

async def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is missing.",
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authorization token.",
        )

    student_id = payload.get("sub")

    if not student_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload.",
        )

    try:
        object_id = ObjectId(
            student_id
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid student ID in token.",
        )

    student = await students_collection.find_one(
        {
            "_id": object_id
        }
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student account not found.",
        )

    return student

# =========================================================
# FILE TEXT EXTRACTION
# =========================================================

async def extract_resume_text(
    file: UploadFile,
):
    filename = file.filename or ""

    extension = os.path.splitext(
        filename
    )[1].lower()

    if extension not in [
        ".pdf",
        ".docx",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed.",
        )

    file_bytes = await file.read()

    # 5 MB limit
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Resume file must be smaller than 5 MB.",
        )

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded resume is empty.",
        )

    try:

        # -------------------------------------------------
        # PDF
        # -------------------------------------------------

        if extension == ".pdf":

            reader = PdfReader(
                BytesIO(file_bytes)
            )

            pages = []

            for page in reader.pages:

                page_text = (
                    page.extract_text()
                    or ""
                )

                if page_text.strip():
                    pages.append(
                        page_text
                    )

            text = "\n".join(
                pages
            )

        # -------------------------------------------------
        # DOCX
        # -------------------------------------------------

        else:

            document = Document(
                BytesIO(file_bytes)
            )

            paragraphs = []

            for paragraph in document.paragraphs:

                value = (
                    paragraph.text
                    or ""
                ).strip()

                if value:
                    paragraphs.append(
                        value
                    )

            text = "\n".join(
                paragraphs
            )

    except Exception as error:

        print(
            "Resume extraction error:",
            repr(error),
        )

        raise HTTPException(
            status_code=400,
            detail=(
                "Could not read the resume file. "
                "Please make sure the PDF/DOCX is valid."
            ),
        )

    # Clean whitespace
    text = re.sub(
        r"[ \t]+",
        " ",
        text,
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )

    text = text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text was found "
                "in the uploaded resume."
            ),
        )

    return text

# =========================================================
# AI JSON PARSER
# =========================================================

def parse_ai_json(
    content: str
):
    if not content:
        return {}

    cleaned = (
        content
        .replace(
            "```json",
            "",
        )
        .replace(
            "```",
            "",
        )
        .strip()
    )

    try:
        return json.loads(
            cleaned
        )
    except Exception:
        pass

    # Find first JSON object
    match = re.search(
        r"\{.*\}",
        cleaned,
        re.DOTALL,
    )

    if match:

        try:
            return json.loads(
                match.group(0)
            )
        except Exception:
            pass

    return {}

# =========================================================
# NORMALIZE AI RESULT
# =========================================================

def normalize_analysis(
    data: dict
):

    if not isinstance(data, dict):
        data = {}

    ats_score = data.get(
        "ats_score",
        data.get(
            "atsScore",
            0,
        ),
    )

    try:
        ats_score = int(
            float(ats_score)
        )
    except Exception:
        ats_score = 0

    ats_score = max(
        0,
        min(
            100,
            ats_score,
        ),
    )

    def safe_list(
        value
    ):
        if isinstance(
            value,
            list,
        ):
            return [
                str(item).strip()
                for item in value
                if str(item).strip()
            ]

        if isinstance(
            value,
            str,
        ):
            return [
                value.strip()
            ] if value.strip() else []

        return []

    return {

        "ats_score":
            ats_score,

        "summary":
            str(
                data.get(
                    "summary",
                    "",
                )
            ).strip(),

        "strengths":
            safe_list(
                data.get(
                    "strengths",
                    [],
                )
            ),

        "weaknesses":
            safe_list(
                data.get(
                    "weaknesses",
                    [],
                )
            ),

        "skills":
            safe_list(
                data.get(
                    "skills",
                    [],
                )
            ),

        "missing_skills":
            safe_list(
                data.get(
                    "missing_skills",
                    [],
                )
            ),

        "improvements":
            safe_list(
                data.get(
                    "improvements",
                    [],
                )
            ),

        "keyword_suggestions":
            safe_list(
                data.get(
                    "keyword_suggestions",
                    [],
                )
            ),

        "experience_feedback":
            safe_list(
                data.get(
                    "experience_feedback",
                    [],
                )
            ),

        "project_feedback":
            safe_list(
                data.get(
                    "project_feedback",
                    [],
                )
            ),
    }

# =========================================================
# GROQ RESUME ANALYSIS
# =========================================================

def analyze_with_groq(
    resume_text: str,
):

    prompt = f"""
You are an ATS resume analysis assistant.

Analyze the following resume carefully.

IMPORTANT RULES:
1. Do not invent information.
2. Only report skills, education, projects,
   experience, certifications and achievements
   that are actually present.
3. Missing skills means skills that appear relevant
   to the resume's stated target/professional direction
   but are not clearly present.
4. ATS score must be an integer from 0 to 100.
5. Be concise and practical.
6. Return ONLY valid JSON.
7. Do not use markdown fences.

Return exactly this structure:

{{
  "ats_score": 0,
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "skills": [],
  "missing_skills": [],
  "improvements": [],
  "keyword_suggestions": [],
  "experience_feedback": [],
  "project_feedback": []
}}

Resume:

---------------- RESUME START ----------------

{resume_text}

---------------- RESUME END ----------------
"""

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
                            "You are a professional "
                            "ATS resume analyzer. "
                            "Return valid JSON only."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],

                temperature=0.1,

                max_completion_tokens=2048,
            )
        )

    except Exception as error:

        print(
            "Groq API error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Resume analysis AI service failed. "
                "Check your Groq API key, model name, "
                "quota, or backend terminal."
            ),
        )

    try:

        content = (
            response
            .choices[0]
            .message
            .content
        )

    except Exception:

        content = ""

    result = parse_ai_json(
        content
    )

    if not result:

        raise HTTPException(
            status_code=502,
            detail=(
                "AI returned an invalid resume "
                "analysis response."
            ),
        )

    return normalize_analysis(
        result
    )

# =========================================================
# ANALYZE RESUME
# =========================================================

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    student=Depends(
        get_current_student
    ),
):

    try:

        resume_text = (
            await extract_resume_text(
                file
            )
        )

        analysis = analyze_with_groq(
            resume_text
        )

        resume_data = {

            "filename":
                file.filename,

            "uploaded_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),

            "resume_text":
                resume_text,

            "analysis":
                analysis,
        }

        await students_collection.update_one(

            {
                "_id":
                    student["_id"]
            },

            {
                "$set": {
                    "resume":
                        resume_data
                }
            },
        )

        return {

            "success":
                True,

            "message":
                "Resume analyzed successfully.",

            "filename":
                file.filename,

            "analysis":
                analysis,

        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Resume analysis error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to analyze resume. "
                "Check the backend terminal for details."
            ),
        )

# =========================================================
# GET SAVED RESUME
# =========================================================

@router.get("/latest")
async def get_latest_resume(
    student=Depends(
        get_current_student
    ),
):

    resume = student.get(
        "resume"
    )

    if not resume:
        return {
            "success": True,
            "resume": None,
        }

    return {
        "success": True,
        "resume": resume,
    }