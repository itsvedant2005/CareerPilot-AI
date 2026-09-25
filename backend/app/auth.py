import os
from datetime import datetime, timedelta, timezone

import bcrypt
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.database import students_collection

load_dotenv()

# ---------------------------------------------------------
# JWT CONFIGURATION
# ---------------------------------------------------------

JWT_SECRET = os.getenv("JWT_SECRET", "careerpilot_ai_secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# ---------------------------------------------------------
# PASSWORD HASHING
# ---------------------------------------------------------

def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    """
    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain password against the stored bcrypt hash.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# ---------------------------------------------------------
# CREATE JWT ACCESS TOKEN
# ---------------------------------------------------------

def create_access_token(student_id: str):
    """
    Create a JWT containing ONLY the student's MongoDB ID
    inside the 'sub' field.

    Correct payload:

    {
        "sub": "66aeb9782668773638efeadb",
        "exp": ...
    }
    """

    if not student_id:
        raise ValueError("student_id is required to create access token.")

    # Make absolutely sure we store only the ID as a string.
    student_id = str(student_id).strip()

    # Validate that it is a MongoDB ObjectId.
    if not ObjectId.is_valid(student_id):
        raise ValueError(
            f"Invalid MongoDB student ID: {student_id}"
        )

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload = {
        "sub": student_id,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )

    return token


# ---------------------------------------------------------
# HTTP BEARER AUTHENTICATION
# ---------------------------------------------------------

security = HTTPBearer(auto_error=False)


# ---------------------------------------------------------
# GET CURRENT LOGGED-IN STUDENT
# ---------------------------------------------------------

async def get_current_student(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Validate the Authorization: Bearer <JWT> header,
    extract the MongoDB student ID from 'sub',
    and return the student document.
    """

    # -----------------------------------------------------
    # STEP 1: TOKEN MUST EXIST
    # -----------------------------------------------------

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is missing."
        )

    token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is empty."
        )

    # -----------------------------------------------------
    # STEP 2: DECODE JWT
    # -----------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

    except JWTError as error:
        print("JWT verification failed:", repr(error))

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authorization token."
        )

    # -----------------------------------------------------
    # STEP 3: GET SUB
    # -----------------------------------------------------

    student_id = payload.get("sub")

    if not student_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload."
        )

    # -----------------------------------------------------
    # STEP 4: SUB MUST BE A VALID OBJECT ID
    # -----------------------------------------------------

    student_id = str(student_id).strip()

    if not ObjectId.is_valid(student_id):
        print(
            "Invalid student ID received from JWT:",
            repr(student_id)
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid student ID in token."
        )

    object_id = ObjectId(student_id)

    # -----------------------------------------------------
    # STEP 5: FIND STUDENT IN MONGODB
    # -----------------------------------------------------

    try:
        student = await students_collection.find_one(
            {"_id": object_id}
        )

    except Exception as error:
        print(
            "Database authentication lookup error:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to access student account."
        )

    # -----------------------------------------------------
    # STEP 6: STUDENT MUST EXIST
    # -----------------------------------------------------

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student account not found."
        )

    # -----------------------------------------------------
    # STEP 7: RETURN STUDENT DOCUMENT
    # -----------------------------------------------------

    return student