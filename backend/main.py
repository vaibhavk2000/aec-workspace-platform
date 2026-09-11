import math
import uuid
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from middleware import get_current_student
from auth import hash_password, verify_password, create_access_token

app = FastAPI(title="AECWebService Engines")

# Core Math Check Route for Structural Line items
class BeamLine(BaseModel):
    id: str
    points: List[float]
    design_load: float = 4.0
    moment_capacity: float = 25.0

@app.post("/api/v1/structural/verify-safety")
async def verify_beams(beams: List[BeamLine], scale: float = 0.1):
    results = []
    for beam in beams:
        pts = beam.points
        span = math.sqrt((pts[2] - pts[0])**2 + (pts[3] - pts[1])**2) * scale
        max_moment = (beam.design_load * (span ** 2)) / 8.0
        results.append({
            "beam_id": beam.id,
            "span_m": round(span, 2),
            "max_moment": round(max_moment, 2),
            "passed": max_moment <= beam.moment_capacity
        })
    return {"status": "success", "results": results}
