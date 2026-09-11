import os
import io
import math
import uuid
import psycopg2
from psycopg2.extras import Json, execute_values
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
import ezdxf

from auth import hash_password, verify_password, create_access_token
from middleware import get_current_student

app = FastAPI(title="AECWebService Engineering Suite Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "aec_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "secret")
DB_PARAMS = f"dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} host={DB_HOST} port=5432"

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class StructuralLine(BaseModel):
    id: str
    points: List[float]
    design_load: float = 5.0
    moment_capacity: float = 25.0
    shear_capacity: float = 30.0

class AnalysisPayload(BaseModel):
    scale_factor: float = 0.05
    beams: List[StructuralLine]

class LayoutSavePayload(BaseModel):
    projectId: str
    elements: List[Dict[str, Any]]
    canvasState: Dict[str, Any]

class SheetSubmission(BaseModel):
    attemptId: str
    projectId: str
    studentName: str
    answers: Dict[str, str]

QUESTION_POOL = {
    "Structural_Beams": [
        {"id": "sb_1", "text": "Where does max bending moment occur for a simply supported beam under UDL?", "options": {"A": "Supports", "B": "Quarter-span", "C": "Mid-span", "D": "Inflection points"}, "correct": "C"},
        {"id": "sb_2", "text": "What is the critical section for checking ultimate shear stress in standard reinforced beams?", "options": {"A": "Face of support", "B": "At effective depth 'd' from support face", "C": "Mid-span", "D": "Center line of support"}, "correct": "B"}
    ]
}

@app.post("/api/v1/auth/signup")
async def signup(user: UserAuth):
    conn = psycopg2.connect(DB_PARAMS)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM students WHERE email = %s;", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Account already exists.")
        cursor.execute("INSERT INTO students (email, hashed_password) VALUES (%s, %s);", (user.email, hash_password(user.password)))
        conn.commit()
        return {"status": "success"}
    finally:
        cursor.close(); conn.close()

@app.post("/api/v1/auth/login")
async def login(user: UserAuth):
    conn = psycopg2.connect(DB_PARAMS)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, hashed_password FROM students WHERE email = %s;", (user.email,))
        row = cursor.fetchone()
        if not row or not verify_password(user.password, row[1]):
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        token = create_access_token({"sub": str(row[0]), "email": user.email})
        return {"status": "success", "access_token": token, "token_type": "bearer"}
    finally:
        cursor.close(); conn.close()

@app.get("/api/v1/auth/verify-token")
async def verify_token(user: dict = Depends(get_current_student)):
    return {"status": "valid", "email": user["email"]}

@app.post("/api/v1/structural/verify-safety")
async def verify_safety(payload: AnalysisPayload):
    results = []
    for beam in payload.beams:
        pts = beam.points
        dist = math.sqrt((pts[2] - pts[0])**2 + (pts[3] - pts[1])**2) * payload.scale_factor
        if dist == 0: continue
        max_m = (beam.design_load * (dist ** 2)) / 8.0
        max_v = (beam.design_load * dist) / 2.0
        m_safe = max_m <= beam.moment_capacity
        v_safe = max_v <= beam.shear_capacity
        results.append({
            "beam_id": beam.id,
            "span_length_m": round(dist, 2),
            "max_moment_knm": round(max_m, 2),
            "max_shear_kn": round(max_v, 2),
            "safety_status": {"moment_passed": m_safe, "shear_passed": v_safe, "passed": m_safe and v_safe}
        })
    return {"status": "success", "results": results}

@app.post("/api/v1/projects/save-state")
async def save_state(payload: LayoutSavePayload, user: dict = Depends(get_current_student)):
    conn = psycopg2.connect(DB_PARAMS)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO canvas_states (project_id, configuration, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (project_id) DO UPDATE SET configuration = EXCLUDED.configuration, updated_at = CURRENT_TIMESTAMP;
        """, (payload.projectId, Json(payload.canvasState)))
        cursor.execute("DELETE FROM cad_elements WHERE project_id = %s;", (payload.projectId,))
        if payload.elements:
            insert_query = "INSERT INTO cad_elements (project_id, layer_name, points) VALUES %s;"
            records = [(payload.projectId, el.get('layer', 'Structural_Beams'), el.get('points')) for el in payload.elements]
            execute_values(cursor, insert_query, records)
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        conn.rollback(); raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); conn.close()

@app.get("/api/v1/projects/{project_id}/load-state")
async def load_state(project_id: str, user: dict = Depends(get_current_student)):
    conn = psycopg2.connect(DB_PARAMS)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT configuration FROM canvas_states WHERE project_id = %s;", (project_id,))
        state_row = cursor.fetchone()
        c_state = state_row[0] if state_row else {"scaleX": 1, "scaleY": 1, "x": 0, "y": 0}
        cursor.execute("SELECT layer_name, points FROM cad_elements WHERE project_id = %s;", (project_id,))
        elements = [{"layer": row[0], "points": row[1]} for row in cursor.fetchall()]
        return {"status": "success", "data": {"projectId": project_id, "canvasState": c_state, "elements": elements}}
    finally:
        cursor.close(); conn.close()

@app.get("/api/v1/projects")
async def list_projects(user: dict = Depends(get_current_student)):
    conn = psycopg2.connect(DB_PARAMS)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, project_name, updated_at FROM projects WHERE student_id = %s ORDER BY updated_at DESC;", (user["student_id"],))
        return {"status": "success", "data": [{"id": str(r[0]), "project_name": r[1], "updated_at": r[2].isoformat()} for r in cursor.fetchall()]}
    finally:
        cursor.close(); conn.close()

@app.post("/api/v1/cad/generate-dxf")
async def generate_dxf(payload: LayoutSavePayload):
    doc = ezdxf.new("R2018")
    msp = doc.modelspace()
    doc.layers.new(name="Structural_Beams", dxfattribs={"color": 3})
    for el in payload.elements:
        pts = el["points"]
        if len(pts) == 4:
            msp.add_line((pts[0], pts[1]), (pts[2], pts[3]), dxfattribs={"layer": "Structural_Beams"})
    stream = io.StringIO()
    doc.write(stream)
    return StreamingResponse(io.BytesIO(stream.getvalue().encode('utf-8')), media_type="application/dxf", headers={"Content-Disposition": f"attachment; filename=layout_{payload.projectId}.dxf"})

@app.post("/api/v1/evaluation/generate-custom-quiz")
async def gen_quiz():
    questions = []
    for layer, qs in QUESTION_POOL.items():
        for q in qs:
            questions.append({"id": q["id"], "text": q["text"], "options": q["options"], "layerContext": layer})
    return {"status": "success", "attemptId": str(uuid.uuid4()), "questions": questions}

@app.post("/api/v1/evaluation/grade-submission")
async def grade_quiz(sub: SheetSubmission, user: dict = Depends(get_current_student)):
    total = len(sub.answers)
    if total == 0: raise HTTPException(status_code=400, detail="Empty sheet.")
    correct = 0
    flat_pool = {q["id"]: q["correct"] for l in QUESTION_POOL.values() for q in l}
    for q_id, ans in sub.answers.items():
        if q_id in flat_pool and flat_pool[q_id] == ans: correct += 1
    score = (correct / total) * 100
    passed = score >= 70.0
    if passed:
        conn = psycopg2.connect(DB_PARAMS)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO certificate_analytics_logs (certificate_id, student_id, project_id, final_score_percentage) VALUES (%s, %s, %s, %s);", (str(uuid.uuid4()), user["student_id"], sub.projectId if sub.projectId else None, score))
        conn.commit(); cursor.close(); conn.close()
    return {"status": "success", "studentName": sub.studentName, "score": round(score, 2), "passed": passed, "certificateId": str(uuid.uuid4()) if passed else None}
