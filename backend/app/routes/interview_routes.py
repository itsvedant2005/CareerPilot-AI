import json
import os
from datetime import datetime, timezone
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from jose import JWTError, jwt
from bson import ObjectId
from groq import Groq

from app.database import students_collection


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/interview",
    tags=["AI Mock Interview"]
)


# =========================================================
# SECURITY
# =========================================================

security = HTTPBearer(auto_error=False)


# =========================================================
# CONSTANTS
# =========================================================

INTERVIEW_TYPES = {
    "Technical Interview": "Technical",
    "Behavioral Interview": "Behavioral",
    "HR Interview": "HR",
    "Mixed Interview": "Mixed",
}

EXPERIENCE_LEVELS = {
    "Fresher": "Fresher",
    "0-2 Years": "0-2 Years",
    "3-5 Years": "3-5 Years",
    "5+ Years": "5+ Years",
}

# Safety cap. The user can finish at any point before this.
MAX_QUESTIONS = 30


# =========================================================
# MODELS
# =========================================================

class StartInterviewRequest(BaseModel):
    interview_type: str
    experience_level: str


class SubmitAnswerRequest(BaseModel):
    session_id: str
    answer: str


class FinishInterviewRequest(BaseModel):
    session_id: str


# =========================================================
# CURRENT STUDENT
# =========================================================

async def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is missing."
        )

    token = credentials.credentials

    jwt_secret = os.getenv("JWT_SECRET")

    if not jwt_secret:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured."
        )

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"]
        )

        student_id = payload.get("sub")

        if not student_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token."
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token."
        )

    try:
        object_id = ObjectId(student_id)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid student ID."
        )

    try:
        student = await students_collection.find_one(
            {"_id": object_id}
        )

    except Exception as error:
        print("Interview MongoDB lookup error:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to access student data."
        )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    return student


# =========================================================
# GROQ CLIENT
# =========================================================

def get_groq_client():

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured."
        )

    try:
        return Groq(api_key=api_key)

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to initialize Groq: "
                f"{type(error).__name__}: {str(error)}"
            )
        )


# =========================================================
# GET INTERVIEW CONTEXT
# =========================================================

def get_interview_context(student):

    resume = student.get(
        "resume",
        {}
    )

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

    if not isinstance(
        student_skills,
        list
    ):
        student_skills = []

    target_role = student.get(
        "target_role",
        "Software Engineer"
    )

    if not target_role:
        target_role = "Software Engineer"

    latest_job_match = student.get(
        "latest_job_match",
        {}
    )

    latest_job_description = ""

    if isinstance(
        latest_job_match,
        dict
    ):
        latest_job_description = latest_job_match.get(
            "job_description",
            ""
        )

    return (
        resume_text,
        student_skills,
        target_role,
        latest_job_description
    )


# =========================================================
# DETERMINE QUESTION CATEGORY
# =========================================================

def determine_category(
    interview_type,
    question_number
):

    if interview_type != "Mixed Interview":
        return INTERVIEW_TYPES[
            interview_type
        ]

    categories = [
        "Technical",
        "Behavioral",
        "HR"
    ]

    return categories[
        (question_number - 1) % 3
    ]


# =========================================================
# QUESTION NORMALIZATION
# =========================================================

def normalize_question_text(value):

    if not isinstance(value, str):
        return ""

    return " ".join(
        value.strip().lower().split()
    )


# =========================================================
# TECHNICAL INTERVIEW TOPIC POOL
# =========================================================

TECHNICAL_TOPIC_POOL = [
    "Programming Fundamentals",
    "Object-Oriented Programming",
    "Data Structures: Arrays and Strings",
    "Data Structures: Linked Lists, Stacks and Queues",
    "Trees, Heaps and Graphs",
    "Algorithms, Searching, Sorting and Complexity",
    "Dynamic Programming and Recursion",
    "DBMS Fundamentals",
    "SQL and Query Writing",
    "Transactions, ACID, Indexing and Normalization",
    "Operating Systems",
    "Computer Networks",
    "HTTP, HTTPS, REST APIs and Web Fundamentals",
    "Backend Development and Authentication",
    "Frontend and Browser Fundamentals",
    "Git, Testing, Debugging and Software Engineering",
    "Cloud and DevOps Fundamentals",
    "Cybersecurity Fundamentals",
    "System Design and Software Architecture",
    "AI, Machine Learning and LLM Fundamentals",
]


def get_technical_topic(question_number):
    index = max(0, int(question_number) - 1) % len(TECHNICAL_TOPIC_POOL)
    return TECHNICAL_TOPIC_POOL[index]


# =========================================================
# GENERATE QUESTION
# =========================================================

def generate_question(
    client,
    category,
    target_role,
    experience_level,
    resume_text,
    student_skills,
    latest_job_description,
    previous_questions,
    question_number=1
):

    # -----------------------------------------------------
    # Normalize interview history first. We use the number of
    # previous questions to rotate through the technical syllabus
    # across sessions instead of restarting at the same topic.
    # -----------------------------------------------------

    previous_questions = [
        question.strip()
        for question in previous_questions
        if isinstance(question, str)
        and question.strip()
    ]

    interview_sequence_number = len(previous_questions) + 1

    # -----------------------------------------------------
    # Difficulty by experience
    # -----------------------------------------------------

    if experience_level == "Fresher":

        difficulty = """
Focus mainly on fundamentals, academic knowledge, learning ability,
and basic practical reasoning. Do not expect senior-level architecture
or production ownership.
"""

    elif experience_level == "0-2 Years":

        difficulty = """
Use early-career practical questions covering coding, debugging,
APIs, databases, Git, testing, teamwork, and fundamental production
awareness.
"""

    elif experience_level == "3-5 Years":

        difficulty = """
Use intermediate-to-senior practical questions involving technical
trade-offs, debugging, design decisions, ownership, collaboration,
project delivery, and production concerns.
"""

    else:

        difficulty = """
Use senior-level questions involving architecture, scalability,
reliability, trade-offs, technical leadership, mentoring, and
cross-team decision making.
"""

    # -----------------------------------------------------
    # Technical topic rotation
    # -----------------------------------------------------

    technical_topic = ""

    if category == "Technical":
        technical_topic = get_technical_topic(
            interview_sequence_number
        )

    # Resume is intentionally secondary for technical interviews.
    if category == "Technical":

        if interview_sequence_number % 8 == 0:

            resume_rule = """
The resume may be used for an occasional contextual question, but the
question must still test a broader engineering concept. Do not simply
ask the candidate to describe a resume bullet or project.
"""

        else:

            resume_rule = """
Do NOT make the resume the source of the question. Treat the resume as
background context only. The selected engineering topic and general
software-engineering knowledge must drive the question.
"""

    elif category == "Behavioral":

        resume_rule = """
Use the resume only when it naturally helps create a relevant behavioral
scenario. Do not invent experience or events that are not in the resume.
"""

    else:

        resume_rule = """
Use the resume only when it naturally helps create a relevant HR question.
Do not invent experience, achievements, or career history.
"""

    # Keep history bounded for the model while the database retains it.
    previous_text = json.dumps(
        previous_questions[-40:]
    )

    # -----------------------------------------------------
    # System prompt
    # -----------------------------------------------------

    system_prompt = f"""
You are conducting a professional {category} interview.

Target role:
{target_role}

Experience level:
{experience_level}

{difficulty}

Main technical topic for this question:
{technical_topic if category == "Technical" else "Not applicable"}

Generate ONE interview-ready question.

Return ONLY valid JSON:

{{
  "category": "{category}",
  "question": "",
  "why_this_question": ""
}}

Rules:

{resume_rule}
- Match the candidate's experience level.
- Do not invent experience for the candidate.
- Do not ask a question that was already asked.
- Do not paraphrase an earlier question.
- Avoid generic repetition.
- For Technical interviews, test general software-engineering knowledge.
- For Technical interviews, use the selected topic as the PRIMARY subject.
- Over multiple questions, cover the broad engineering syllabus instead of
  staying on one subject or on resume projects.
- Suitable technical areas include programming, OOP, DSA, algorithms,
  complexity, DBMS, SQL, operating systems, computer networks, web,
  REST APIs, backend, frontend, testing, Git, DevOps, cloud, security,
  system design, and AI/ML fundamentals.
- Behavioral questions should test actual behavior and situations.
- HR questions should test motivation, communication, goals, teamwork,
  workplace expectations, and career interests.
- Keep the wording clear and interview-ready.
- Return JSON only.
"""

    previous_normalized = {
        normalize_question_text(item)
        for item in previous_questions
    }

    last_generated_question = ""

    # -----------------------------------------------------
    # Generate with duplicate protection
    # -----------------------------------------------------

    for attempt in range(4):

        retry_instruction = ""

        if attempt > 0:

            retry_instruction = f"""

IMPORTANT RETRY RULE:
The previous generated question was already used:
{last_generated_question}

Generate a materially different question now. Do not paraphrase it.
Change the underlying concept, skill, scenario, or situation.
"""

        current_system_prompt = (
            system_prompt
            + retry_instruction
        )

        current_user_prompt = f"""
INTERVIEW TYPE:
{category}

TARGET ROLE:
{target_role}

EXPERIENCE LEVEL:
{experience_level}

MAIN TECHNICAL TOPIC:
{technical_topic if category == "Technical" else "Not applicable"}

SECONDARY CANDIDATE CONTEXT:

Student skills:
{json.dumps(student_skills)}

Resume:
{resume_text[:5000]}

Latest job description:
{latest_job_description[:3000]}

PREVIOUS QUESTIONS - NEVER REPEAT OR PARAPHRASE:
{previous_text}

Generate ONE genuinely new interview question.
For a Technical interview, prioritize the MAIN TECHNICAL TOPIC over the
resume and ask a general engineering question suitable for the experience
level.
"""

        try:

            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {
                        "role": "system",
                        "content": current_system_prompt
                    },
                    {
                        "role": "user",
                        "content": current_user_prompt
                    }
                ],
                response_format={
                    "type": "json_object"
                },
                reasoning_effort="low",
                include_reasoning=False,
                max_completion_tokens=2048,
                temperature=0.65
            )

        except Exception as error:

            print()
            print("======================================")
            print("INTERVIEW QUESTION GROQ ERROR")
            print("TYPE:", type(error).__name__)
            print("ERROR:", str(error))
            print("======================================")

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Groq Error: "
                    f"{type(error).__name__}: {str(error)}"
                )
            )

        content = response.choices[0].message.content

        if not content:

            raise HTTPException(
                status_code=500,
                detail="Groq returned an empty question."
            )

        try:

            result = json.loads(content)

        except json.JSONDecodeError as error:

            print("Invalid question JSON:", content)

            if attempt == 3:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Groq returned invalid JSON: {str(error)}"
                    )
                )

            continue

        question = result.get(
            "question"
        )

        if not isinstance(
            question,
            str
        ) or not question.strip():

            if attempt == 3:

                raise HTTPException(
                    status_code=500,
                    detail="Groq failed to generate a valid question."
                )

            continue

        question = question.strip()
        last_generated_question = question

        normalized = normalize_question_text(
            question
        )

        if normalized in previous_normalized:

            print(
                "Duplicate interview question detected; "
                f"retrying ({attempt + 1}/4)."
            )

            previous_questions.append(
                question
            )

            previous_text = json.dumps(
                previous_questions[-40:]
            )

            previous_normalized.add(
                normalized
            )

            continue

        return {
            "category": category,
            "question": question,
            "why_this_question": result.get(
                "why_this_question",
                ""
            )
        }

    raise HTTPException(
        status_code=500,
        detail="Could not generate a new interview question. Please try again."
    )

# =========================================================
# START INTERVIEW
# =========================================================

@router.post("/start")
async def start_interview(
    request: StartInterviewRequest,
    student=Depends(get_current_student)
):

    # -----------------------------------------------------
    # Validate type
    # -----------------------------------------------------

    if request.interview_type not in INTERVIEW_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid interview type."
            )
        )

    # -----------------------------------------------------
    # Validate level
    # -----------------------------------------------------

    if request.experience_level not in EXPERIENCE_LEVELS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid experience level."
            )
        )

    # -----------------------------------------------------
    # Resume required
    # -----------------------------------------------------

    resume = student.get(
        "resume"
    )

    if not resume:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please analyze your resume first. "
                "Your resume is required for the mock interview."
            )
        )

    resume_text = resume.get(
        "resume_text",
        ""
    )

    if not resume_text.strip():

        raise HTTPException(
            status_code=400,
            detail=(
                "Your stored resume does not contain readable text."
            )
        )

    # -----------------------------------------------------
    # No second active interview
    # -----------------------------------------------------

    if student.get(
        "active_interview"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "You already have an active interview. "
                "Finish or cancel it first."
            )
        )

    (
        resume_text,
        student_skills,
        target_role,
        latest_job_description
    ) = get_interview_context(
        student
    )

    client = get_groq_client()

    # -----------------------------------------------------
    # First category
    # -----------------------------------------------------

    category = determine_category(
        request.interview_type,
        1
    )

    # -----------------------------------------------------
    # First question
    # -----------------------------------------------------

    previous_question_history = student.get(
        "interview_question_history",
        []
    )

    if not isinstance(previous_question_history, list):
        previous_question_history = []

    question = generate_question(
        client=client,
        category=category,
        target_role=target_role,
        experience_level=request.experience_level,
        resume_text=resume_text,
        student_skills=student_skills,
        latest_job_description=latest_job_description,
        previous_questions=previous_question_history,
        question_number=1
    )

    # -----------------------------------------------------
    # Session
    # -----------------------------------------------------

    session_id = str(
        uuid4()
    )

    started_at = datetime.now(
        timezone.utc
    )

    active_interview = {
        "session_id": session_id,
        "interview_type": request.interview_type,
        "experience_level": request.experience_level,
        "target_role": target_role,
        "started_at": started_at,
        "question_number": 1,
        "current_question": question,
        "questions": []
    }

    # -----------------------------------------------------
    # Save
    # -----------------------------------------------------

    try:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$set": {
                    "active_interview":
                        active_interview
                },
                "$addToSet": {
                    "interview_question_history":
                        question.get("question", "")
                }
            }
        )

    except Exception as error:

        print(
            "Interview start save error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to start interview: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    return {
        "message": "Interview started successfully",
        "session_id": session_id,
        "interview_type": request.interview_type,
        "experience_level": request.experience_level,
        "target_role": target_role,
        "question_number": 1,
        "question": question
    }


# =========================================================
# SUBMIT ANSWER
# =========================================================

@router.post("/answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    student=Depends(get_current_student)
):

    answer = request.answer.strip()

    if not answer:

        raise HTTPException(
            status_code=400,
            detail="Please provide an answer."
        )

    if len(answer) < 5:

        raise HTTPException(
            status_code=400,
            detail="Please provide a more complete answer."
        )

    active = student.get(
        "active_interview"
    )

    if not active:

        raise HTTPException(
            status_code=400,
            detail="No active interview found."
        )

    if active.get(
        "session_id"
    ) != request.session_id:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview session."
        )

    question_number = int(
        active.get(
            "question_number",
            1
        )
    )

    interview_type = active.get(
        "interview_type"
    )

    experience_level = active.get(
        "experience_level",
        "Fresher"
    )

    target_role = active.get(
        "target_role",
        "Software Engineer"
    )

    current_question = active.get(
        "current_question",
        {}
    )

    current_category = current_question.get(
        "category",
        "Technical"
    )

    questions = active.get(
        "questions",
        []
    )

    if not isinstance(
        questions,
        list
    ):
        questions = []

    # -----------------------------------------------------
    # Context
    # -----------------------------------------------------

    (
        resume_text,
        student_skills,
        target_role,
        latest_job_description
    ) = get_interview_context(
        student
    )

    client = get_groq_client()

    # -----------------------------------------------------
    # Evaluate answer
    # -----------------------------------------------------

    system_prompt = f"""
You are a professional {current_category} interviewer.

Evaluate the candidate's answer.

Target role:
{target_role}

Experience level:
{experience_level}

Return ONLY valid JSON:

{{
  "score": 0,
  "feedback": "",
  "strengths": [],
  "improvements": []
}}

Scoring:

10 = excellent
8-9 = very good
6-7 = acceptable
4-5 = weak
2-3 = poor
0-1 = little useful content

Rules:

- Evaluate only the answer actually given.
- Do not invent experience.
- Match expectations to the candidate's experience level.
- For technical questions, assess correctness,
  understanding and reasoning.
- For behavioral questions, assess clarity,
  ownership, relevance and examples.
- For HR questions, assess professionalism,
  communication, motivation and clarity.
- Be specific.
- Keep feedback concise.
- Return valid JSON only.
"""

    user_prompt = f"""
TARGET ROLE:
{target_role}

EXPERIENCE LEVEL:
{experience_level}

INTERVIEW TYPE:
{interview_type}

QUESTION:
{current_question.get("question", "")}

STUDENT ANSWER:
{answer}

STUDENT RESUME:
{resume_text[:7000]}

STUDENT SKILLS:
{json.dumps(student_skills)}
"""

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
            max_completion_tokens=2048,
            temperature=0.25
        )

    except Exception as error:

        print("Interview answer Groq error:", error)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Groq Error: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    content = response.choices[0].message.content

    if not content:

        raise HTTPException(
            status_code=500,
            detail="Groq returned an empty evaluation."
        )

    try:

        evaluation = json.loads(
            content
        )

    except json.JSONDecodeError as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Groq returned invalid JSON: "
                f"{str(error)}"
            )
        )

    # -----------------------------------------------------
    # Score
    # -----------------------------------------------------

    try:

        score = float(
            evaluation.get(
                "score",
                0
            )
        )

    except (
        TypeError,
        ValueError
    ):

        score = 0

    score = max(
        0,
        min(
            10,
            score
        )
    )

    score = round(
        score,
        1
    )

    # -----------------------------------------------------
    # Arrays
    # -----------------------------------------------------

    strengths = evaluation.get(
        "strengths",
        []
    )

    improvements = evaluation.get(
        "improvements",
        []
    )

    if not isinstance(
        strengths,
        list
    ):
        strengths = []

    if not isinstance(
        improvements,
        list
    ):
        improvements = []

    # -----------------------------------------------------
    # Save answer
    # -----------------------------------------------------

    answer_record = {
        "question_number": question_number,
        "category": current_category,
        "question": current_question.get(
            "question",
            ""
        ),
        "answer": answer,
        "score": score,
        "feedback": evaluation.get(
            "feedback",
            ""
        ),
        "strengths": strengths[:5],
        "improvements": improvements[:5],
        "answered_at": datetime.now(
            timezone.utc
        )
    }

    questions.append(
        answer_record
    )

    # -----------------------------------------------------
    # Safety limit
    # -----------------------------------------------------

    if question_number >= MAX_QUESTIONS:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$set": {
                    "active_interview.questions":
                        questions
                }
            }
        )

        return {
            "completed": False,
            "safety_limit_reached": True,
            "message": (
                "You reached the maximum session limit. "
                "Please finish the interview."
            ),
            "evaluation": {
                "score": score,
                "feedback": evaluation.get(
                    "feedback",
                    ""
                ),
                "strengths": strengths,
                "improvements": improvements
            },
            "progress": {
                "current_question":
                    question_number,
                "questions_answered":
                    len(questions)
            }
        }

    # -----------------------------------------------------
    # Previous questions
    # -----------------------------------------------------

    previous_questions = []

    for item in questions:

        if isinstance(
            item,
            dict
        ):

            previous_questions.append(
                item.get(
                    "question",
                    ""
                )
            )

    # -----------------------------------------------------
    # Previous questions across ALL interviews
    # -----------------------------------------------------

    global_question_history = student.get(
        "interview_question_history",
        []
    )

    if not isinstance(global_question_history, list):
        global_question_history = []

    combined_previous_questions = [
        *global_question_history[-40:],
        *previous_questions
    ]

    # -----------------------------------------------------
    # Next category
    # -----------------------------------------------------

    next_question_number = (
        question_number + 1
    )

    next_category = determine_category(
        interview_type,
        next_question_number
    )

    # -----------------------------------------------------
    # Generate next question
    # -----------------------------------------------------

    next_question = generate_question(
        client=client,
        category=next_category,
        target_role=target_role,
        experience_level=experience_level,
        resume_text=resume_text,
        student_skills=student_skills,
        latest_job_description=latest_job_description,
        previous_questions=combined_previous_questions,
        question_number=next_question_number
    )

    # -----------------------------------------------------
    # Update active session
    # -----------------------------------------------------

    updated_active = active.copy()

    updated_active[
        "questions"
    ] = questions

    updated_active[
        "question_number"
    ] = next_question_number

    updated_active[
        "current_question"
    ] = next_question

    try:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$set": {
                    "active_interview":
                        updated_active
                },
                "$addToSet": {
                    "interview_question_history":
                        next_question.get("question", "")
                }
            }
        )

    except Exception as error:

        print(
            "Interview session update error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to continue interview: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    return {
        "completed": False,
        "evaluation": {
            "score": score,
            "feedback": evaluation.get(
                "feedback",
                ""
            ),
            "strengths": strengths,
            "improvements": improvements
        },
        "next_question": next_question,
        "progress": {
            "current_question":
                next_question_number,
            "questions_answered":
                len(questions)
        }
    }


# =========================================================
# FINISH INTERVIEW
# =========================================================

@router.post("/finish")
async def finish_interview(
    request: FinishInterviewRequest,
    student=Depends(get_current_student)
):

    active = student.get(
        "active_interview"
    )

    if not active:

        raise HTTPException(
            status_code=400,
            detail="No active interview found."
        )

    if active.get(
        "session_id"
    ) != request.session_id:

        raise HTTPException(
            status_code=400,
            detail="Invalid interview session."
        )

    questions = active.get(
        "questions",
        []
    )

    if not isinstance(
        questions,
        list
    ):
        questions = []

    if len(questions) == 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Answer at least one question before "
                "ending the interview."
            )
        )

    # -----------------------------------------------------
    # Overall score
    # -----------------------------------------------------

    scores = []

    for item in questions:

        try:
            scores.append(
                float(
                    item.get(
                        "score",
                        0
                    )
                )
            )

        except (
            TypeError,
            ValueError
        ):
            pass

    if scores:

        average_score = (
            sum(scores)
            / len(scores)
        )

    else:

        average_score = 0

    overall_score = round(
        average_score * 10
    )

    # -----------------------------------------------------
    # Category scores
    # -----------------------------------------------------

    category_scores = {}

    categories = [
        "Technical",
        "Behavioral",
        "HR"
    ]

    for category in categories:

        category_items = [
            item
            for item in questions
            if item.get("category") == category
        ]

        if category_items:

            category_average = (
                sum(
                    float(
                        item.get(
                            "score",
                            0
                        )
                    )
                    for item in category_items
                )
                /
                len(category_items)
            )

            category_scores[
                category
            ] = round(
                category_average * 10
            )

    # -----------------------------------------------------
    # Collect feedback
    # -----------------------------------------------------

    strengths = []

    improvements = []

    for item in questions:

        for value in item.get(
            "strengths",
            []
        ):

            if (
                value not in strengths
                and len(strengths) < 8
            ):

                strengths.append(
                    value
                )

        for value in item.get(
            "improvements",
            []
        ):

            if (
                value not in improvements
                and len(improvements) < 8
            ):

                improvements.append(
                    value
                )

    # -----------------------------------------------------
    # Final AI report
    # -----------------------------------------------------

    client = get_groq_client()

    compact_questions = []

    for item in questions:

        compact_questions.append(
            {
                "number": item.get(
                    "question_number"
                ),
                "category": item.get(
                    "category"
                ),
                "question": item.get(
                    "question",
                    ""
                )[:500],
                "answer": item.get(
                    "answer",
                    ""
                )[:1200],
                "score": item.get(
                    "score",
                    0
                ),
                "feedback": item.get(
                    "feedback",
                    ""
                )[:500]
            }
        )

    report_prompt = f"""
You are an expert interview coach.

Create a final report for this completed mock interview.

Interview type:
{active.get("interview_type")}

Experience level:
{active.get("experience_level")}

Target role:
{active.get("target_role")}

Overall score:
{overall_score}/100

Category scores:
{json.dumps(category_scores)}

Questions and answers:
{json.dumps(compact_questions)}

Return ONLY valid JSON:

{{
  "summary": "",
  "strengths": [],
  "improvements": [],
  "final_advice": ""
}}

Rules:

- Base everything only on the actual answers.
- Respect the candidate's selected experience level.
- Do not invent experience or achievements.
- Summary must be concise.
- Strengths must be specific.
- Improvements must be actionable.
- Final advice should explain what the candidate should
  practice before a real interview.
- Return valid JSON only.
"""

    try:

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": report_prompt
                }
            ],
            response_format={
                "type": "json_object"
            },
            reasoning_effort="low",
            include_reasoning=False,
            max_completion_tokens=2048,
            temperature=0.25
        )

        report_content = (
            response
            .choices[0]
            .message
            .content
        )

        if report_content:

            try:

                final_report = json.loads(
                    report_content
                )

            except json.JSONDecodeError:

                final_report = {}

        else:

            final_report = {}

    except Exception as error:

        print(
            "Final interview report error:",
            error
        )

        final_report = {}

    if not final_report:

        final_report = {
            "summary": (
                "Interview completed successfully."
            ),
            "strengths": strengths,
            "improvements": improvements,
            "final_advice": (
                "Review your lower-scoring answers "
                "and practice explaining your reasoning clearly."
            )
        }

    # -----------------------------------------------------
    # Completed record
    # -----------------------------------------------------

    completed_at = datetime.now(
        timezone.utc
    )

    interview_record = {
        "session_id": active.get(
            "session_id"
        ),
        "interview_type": active.get(
            "interview_type"
        ),
        "experience_level": active.get(
            "experience_level"
        ),
        "target_role": active.get(
            "target_role"
        ),
        "started_at": active.get(
            "started_at"
        ),
        "completed_at": completed_at,
        "total_questions": len(
            questions
        ),
        "overall_score": overall_score,
        "category_scores": category_scores,
        "questions": questions,
        "final_report": {
            "summary": final_report.get(
                "summary",
                ""
            ),
            "strengths": final_report.get(
                "strengths",
                strengths
            ),
            "improvements": final_report.get(
                "improvements",
                improvements
            ),
            "final_advice": final_report.get(
                "final_advice",
                ""
            )
        }
    }

    # -----------------------------------------------------
    # Save history and remove active session
    # -----------------------------------------------------

    try:

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$push": {
                    "interview_history":
                        interview_record
                },
                "$unset": {
                    "active_interview": ""
                }
            }
        )

    except Exception as error:

        print(
            "Interview history save error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to save interview history: "
                f"{type(error).__name__}: {str(error)}"
            )
        )

    return {
        "completed": True,
        "message": "Interview completed successfully.",
        "result": {
            "session_id": interview_record[
                "session_id"
            ],
            "interview_type": interview_record[
                "interview_type"
            ],
            "experience_level": interview_record[
                "experience_level"
            ],
            "target_role": interview_record[
                "target_role"
            ],
            "total_questions": interview_record[
                "total_questions"
            ],
            "overall_score": overall_score,
            "category_scores": category_scores,
            "questions": questions,
            "final_report": interview_record[
                "final_report"
            ],
            "completed_at":
                completed_at.isoformat()
        }
    }


# =========================================================
# ACTIVE INTERVIEW
# =========================================================

@router.get("/active")
async def get_active_interview(
    student=Depends(get_current_student)
):

    active = student.get(
        "active_interview"
    )

    if not active:

        return {
            "active": False,
            "interview": None
        }

    return {
        "active": True,
        "interview": {
            "session_id": active.get(
                "session_id"
            ),
            "interview_type": active.get(
                "interview_type"
            ),
            "experience_level": active.get(
                "experience_level"
            ),
            "target_role": active.get(
                "target_role"
            ),
            "question_number": active.get(
                "question_number",
                1
            ),
            "questions_answered": len(
                active.get(
                    "questions",
                    []
                )
            ),
            "question": active.get(
                "current_question",
                {}
            )
        }
    }


# =========================================================
# CANCEL INTERVIEW
# =========================================================

@router.delete("/active")
async def cancel_active_interview(
    student=Depends(get_current_student)
):

    await students_collection.update_one(
        {
            "_id": student["_id"]
        },
        {
            "$unset": {
                "active_interview": ""
            }
        }
    )

    return {
        "message": "Interview cancelled successfully."
    }


# =========================================================
# INTERVIEW HISTORY
# =========================================================

@router.get("/history")
async def get_interview_history(
    student=Depends(get_current_student)
):

    history = student.get(
        "interview_history",
        []
    )

    if not isinstance(
        history,
        list
    ):
        history = []

    result = []

    for interview in history:

        if not isinstance(
            interview,
            dict
        ):
            continue

        started_at = interview.get(
            "started_at"
        )

        completed_at = interview.get(
            "completed_at"
        )

        if started_at and hasattr(
            started_at,
            "isoformat"
        ):

            started_at = started_at.isoformat()

        elif started_at:

            started_at = str(
                started_at
            )

        if completed_at and hasattr(
            completed_at,
            "isoformat"
        ):

            completed_at = completed_at.isoformat()

        elif completed_at:

            completed_at = str(
                completed_at
            )

        result.append(
            {
                "session_id": interview.get(
                    "session_id"
                ),
                "interview_type": interview.get(
                    "interview_type"
                ),
                "experience_level": interview.get(
                    "experience_level"
                ),
                "target_role": interview.get(
                    "target_role"
                ),
                "started_at": started_at,
                "completed_at": completed_at,
                "total_questions": interview.get(
                    "total_questions",
                    0
                ),
                "overall_score": interview.get(
                    "overall_score",
                    0
                ),
                "category_scores": interview.get(
                    "category_scores",
                    {}
                ),
                "questions": interview.get(
                    "questions",
                    []
                ),
                "final_report": interview.get(
                    "final_report",
                    {}
                )
            }
        )

    result.reverse()

    return {
        "count": len(result),
        "history": result
    }