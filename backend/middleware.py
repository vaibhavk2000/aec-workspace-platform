from fastapi import Header, HTTPException, status
import jwt
from auth import SECRET_KEY, ALGORITHM

async def get_current_student(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing or malformed authorization credentials."
        )
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"student_id": payload.get("sub"), "email": payload.get("email")}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Signature verification check failed."
        )
