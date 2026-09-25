from pydantic import BaseModel, EmailStr


class StudentRegister(BaseModel):

    name: str

    email: EmailStr

    password: str

    college: str

    target_role: str


class StudentLogin(BaseModel):

    email: EmailStr

    password: str