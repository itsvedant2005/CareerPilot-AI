from fastapi import APIRouter, Depends, HTTPException

from app.auth import (
    create_access_token,
    get_current_student,
    hash_password,
    verify_password,
)
from app.database import students_collection
from app.models import StudentLogin, StudentRegister


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
async def register(student: StudentRegister):

    try:
        # -------------------------------------------------
        # NORMALIZE EMAIL
        # -------------------------------------------------

        email = str(student.email).lower().strip()

        # -------------------------------------------------
        # CHECK EXISTING USER
        # -------------------------------------------------

        existing_student = await students_collection.find_one(
            {
                "email": email
            }
        )

        if existing_student:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists."
            )

        # -------------------------------------------------
        # HASH PASSWORD
        # -------------------------------------------------

        hashed_password = hash_password(
            student.password
        )

        # -------------------------------------------------
        # CREATE STUDENT
        # -------------------------------------------------

        student_document = {
            "name": student.name.strip(),
            "email": email,
            "password": hashed_password,
            "college": student.college.strip(),
            "target_role": student.target_role.strip(),
        }

        # -------------------------------------------------
        # INSERT INTO MONGODB
        # -------------------------------------------------

        result = await students_collection.insert_one(
            student_document
        )

        return {
            "success": True,
            "message": "Registration successful.",
            "student_id": str(result.inserted_id)
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Registration error:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Registration failed."
        )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
async def login(student: StudentLogin):

    try:
        # -------------------------------------------------
        # NORMALIZE EMAIL
        # -------------------------------------------------

        email = str(student.email).lower().strip()

        # -------------------------------------------------
        # FIND STUDENT
        # -------------------------------------------------

        existing_student = await students_collection.find_one(
            {
                "email": email
            }
        )

        if not existing_student:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # -------------------------------------------------
        # VERIFY PASSWORD
        # -------------------------------------------------

        stored_password = existing_student.get(
            "password",
            ""
        )

        password_valid = verify_password(
            student.password,
            stored_password
        )

        if not password_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # -------------------------------------------------
        # CREATE JWT
        #
        # IMPORTANT:
        # Pass ONLY existing_student["_id"]
        #
        # NOT:
        # {
        #     "student_id": ...,
        #     "email": ...
        # }
        # -------------------------------------------------

        token = create_access_token(
            str(existing_student["_id"])
        )

        # -------------------------------------------------
        # RETURN RESPONSE
        # -------------------------------------------------

        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "student": {
                "id": str(existing_student["_id"]),
                "name": existing_student.get(
                    "name",
                    ""
                ),
                "email": existing_student.get(
                    "email",
                    ""
                ),
                "college": existing_student.get(
                    "college",
                    ""
                ),
                "target_role": existing_student.get(
                    "target_role",
                    ""
                ),
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Login error:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Login failed."
        )


# =========================================================
# GET CURRENT STUDENT PROFILE
# =========================================================

@router.get("/me")
async def get_me(
    student=Depends(get_current_student)
):

    return {
        "id": str(student["_id"]),
        "name": student.get(
            "name",
            ""
        ),
        "email": student.get(
            "email",
            ""
        ),
        "college": student.get(
            "college",
            ""
        ),
        "target_role": student.get(
            "target_role",
            ""
        ),
    }


# =========================================================
# UPDATE CURRENT STUDENT PROFILE
# =========================================================

@router.put("/me")
async def update_me(
    data: dict,
    student=Depends(get_current_student)
):

    try:
        allowed_fields = [
            "name",
            "college",
            "target_role",
        ]

        update_data = {}

        # -------------------------------------------------
        # GET VALID PROFILE FIELDS
        # -------------------------------------------------

        for field in allowed_fields:

            if field in data:

                value = str(
                    data[field]
                ).strip()

                update_data[field] = value

        # -------------------------------------------------
        # NOTHING TO UPDATE
        # -------------------------------------------------

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No profile fields provided."
            )

        # -------------------------------------------------
        # UPDATE MONGODB
        # -------------------------------------------------

        await students_collection.update_one(
            {
                "_id": student["_id"]
            },
            {
                "$set": update_data
            }
        )

        # -------------------------------------------------
        # FETCH UPDATED STUDENT
        # -------------------------------------------------

        updated_student = await students_collection.find_one(
            {
                "_id": student["_id"]
            }
        )

        # -------------------------------------------------
        # RETURN UPDATED PROFILE
        # -------------------------------------------------

        return {
            "success": True,
            "message": "Profile updated successfully.",
            "student": {
                "id": str(updated_student["_id"]),
                "name": updated_student.get(
                    "name",
                    ""
                ),
                "email": updated_student.get(
                    "email",
                    ""
                ),
                "college": updated_student.get(
                    "college",
                    ""
                ),
                "target_role": updated_student.get(
                    "target_role",
                    ""
                ),
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            "Profile update error:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update profile."
        )