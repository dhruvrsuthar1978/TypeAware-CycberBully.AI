from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any
from uuid import uuid4
from datetime import datetime, timezone
import base64
import hashlib

from app.services.moderation import moderation_engine
from app.data.store import store

app = FastAPI(title="TypeAware Moderation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ModerateRequest(BaseModel):
    text: str = Field(min_length=1)


class SendMessageRequest(BaseModel):
    author_id: str = Field(min_length=1)
    text: str = Field(min_length=1)


class ReportRequest(BaseModel):
    reporter_id: str = Field(min_length=1)
    message_id: str = Field(min_length=1)


class AnalyzeContentRequest(BaseModel):
    content: str = Field(min_length=1)
    context: dict[str, Any] | None = None


class RephraseRequest(BaseModel):
    content: str | None = None
    message: str | None = None


class ExtensionReportRequest(BaseModel):
    content: str = Field(min_length=1)
    flagReason: str | None = None
    platform: str | None = None
    context: dict[str, Any] | None = None
    timestamp: str | None = None


class RegisterRequest(BaseModel):
    username: str | None = None
    name: str | None = None
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


class AnalyzeResponseData(BaseModel):
    category: str
    severity: str
    toxicity_score: float
    explanation: str
    suggestion: str
    matches: list[dict[str, Any]]
    message: str


users_by_email: dict[str, dict[str, Any]] = {}
users_by_id: dict[str, dict[str, Any]] = {}
tokens: dict[str, str] = {}
user_reports: dict[str, list[dict[str, Any]]] = {}
extension_reports: list[dict[str, Any]] = []
extension_reports_by_uuid: dict[str, list[dict[str, Any]]] = {}


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _issue_token(user_id: str) -> str:
    raw = f"{user_id}:{uuid4()}"
    token = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("utf-8").rstrip("=")
    tokens[token] = user_id
    return token


def _extract_bearer(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.strip().split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1]


def _get_current_user(authorization: str | None) -> dict[str, Any]:
    token = _extract_bearer(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token.")

    user_id = tokens.get(token)
    if not user_id or user_id not in users_by_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return users_by_id[user_id]


def _analysis_payload(result: dict[str, Any]) -> AnalyzeResponseData:
    severity = result.get("severity", "none")
    category = "safe"
    if result.get("flagged"):
        category = "harassment"
        if severity == "high":
            category = "threat"
        elif severity == "medium":
            category = "toxic"

    return AnalyzeResponseData(
        category=category,
        severity=severity,
        toxicity_score=float(result.get("risk_score", 0.0)),
        explanation=result.get("message", "No explanation available."),
        suggestion=result.get("suggestion", ""),
        matches=result.get("matches", []),
        message=result.get("message", ""),
    )


def _default_rephrases(text: str, suggestion: str) -> list[dict[str, Any]]:
    clean = suggestion.strip() if suggestion else ""
    if not clean:
        clean = "Please rewrite this in a respectful and constructive way."

    return [
        {
            "type": "respectful",
            "suggested_text": clean,
            "confidence": 0.88,
        },
        {
            "type": "neutral",
            "suggested_text": "I disagree, but I want to discuss this respectfully.",
            "confidence": 0.79,
        },
    ]


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "typeaware-fastapi",
    }


@app.get("/api/status")
def status() -> dict:
    return {
        "api": "TypeAware Moderation API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict:
    email = payload.email.strip().lower()
    if email in users_by_email:
        raise HTTPException(status_code=409, detail="Email already registered.")

    username = (payload.username or payload.name or "").strip()
    if not username:
        username = email.split("@", 1)[0]

    user_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": user_id,
        "name": username,
        "username": username,
        "email": email,
        "password_hash": _hash_password(payload.password),
        "role": "user",
        "created_at": now,
    }
    users_by_email[email] = user
    users_by_id[user_id] = user
    user_reports[user_id] = []

    token = _issue_token(user_id)
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"],
        },
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict:
    email = payload.email.strip().lower()
    user = users_by_email.get(email)
    if not user or user["password_hash"] != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = _issue_token(user["id"])
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"],
        },
    }


@app.post("/api/moderate")
def moderate(payload: ModerateRequest) -> dict:
    result = moderation_engine.analyze(payload.text)
    return result


@app.post("/api/message")
def send_message(payload: SendMessageRequest) -> dict:
    if store.is_blocked(payload.author_id):
        return {
            "accepted": False,
            "reason": "User is temporarily blocked due to repeated harmful behavior.",
        }

    result = moderation_engine.analyze(payload.text)
    message = store.create_message(payload.author_id, payload.text, result)

    if result["flagged"]:
        store.increment_offense(payload.author_id)

    return {
        "accepted": not result["flagged"],
        "message": message,
        "moderation": result,
        "user_state": store.get_user_state(payload.author_id),
    }


@app.post("/api/report")
def report_message(payload: ReportRequest) -> dict:
    report_result = store.report_message(payload.reporter_id, payload.message_id)
    return report_result


@app.get("/api/admin/flags")
def admin_flags() -> dict:
    return {
        "flagged_messages": store.get_flagged_messages(),
        "extension_reports": extension_reports,
    }


@app.get("/api/admin/users")
def admin_users() -> dict:
    return {"users": store.get_users()}


@app.post("/api/analyze")
def analyze_content(payload: AnalyzeContentRequest) -> dict:
    result = moderation_engine.analyze(payload.content)
    data = _analysis_payload(result)
    return {"success": True, "data": data.model_dump()}


@app.post("/api/ai/analyze")
def extension_ai_analyze(payload: AnalyzeContentRequest) -> dict:
    result = moderation_engine.analyze(payload.content)
    data = _analysis_payload(result).model_dump()
    return {"success": True, "data": data, "analysis": data}


@app.post("/api/ai/rephrase")
def ai_rephrase(payload: RephraseRequest) -> dict:
    text = (payload.message or payload.content or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Either content or message is required.")

    result = moderation_engine.analyze(text)
    suggestions = _default_rephrases(text, result.get("suggestion", ""))
    return {
        "success": True,
        "data": {"suggestions": suggestions},
        "suggestions": [s["suggested_text"] for s in suggestions],
    }


@app.post("/api/rephrase")
def rephrase(payload: RephraseRequest) -> dict:
    return ai_rephrase(payload)


@app.get("/api/reports/user")
def get_user_reports(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user(authorization)
    return {"reports": user_reports.get(user["id"], [])}


@app.delete("/api/reports/clear")
def clear_user_reports(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user(authorization)
    user_reports[user["id"]] = []
    return {"success": True}


@app.get("/api/analytics/user")
def user_analytics(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user(authorization)
    reports = user_reports.get(user["id"], [])
    messages_scanned = len([m for m in store.messages if m.get("author_id") == user["id"]])
    threats_detected = len(
        [
            m
            for m in store.messages
            if m.get("author_id") == user["id"] and m.get("moderation", {}).get("flagged")
        ]
    )

    positivity = 100
    if messages_scanned > 0:
        positivity = max(0, round((1 - (threats_detected / messages_scanned)) * 100))

    return {
        "messagesScanned": messages_scanned,
        "threatsDetected": threats_detected,
        "reportsSubmitted": len(reports),
        "positivityScore": positivity,
        "accountCreated": user.get("created_at"),
    }


@app.post("/api/extension/reports")
def extension_report(
    payload: ExtensionReportRequest,
    authorization: str | None = Header(default=None),
    x_user_uuid: str | None = Header(default=None),
) -> dict:
    report_id = str(uuid4())
    user_id = None
    token = _extract_bearer(authorization)
    if token:
        user_id = tokens.get(token)

    now = payload.timestamp or datetime.now(timezone.utc).isoformat()
    report_record = {
        "id": report_id,
        "platform": payload.platform or "web",
        "content": payload.content,
        "reason": payload.flagReason or "Potential abuse",
        "status": "Pending",
        "timestamp": now,
        "user_uuid": x_user_uuid,
    }
    extension_reports.append(report_record)
    if x_user_uuid:
        extension_reports_by_uuid.setdefault(x_user_uuid, []).append(report_record)
    if user_id:
        user_reports.setdefault(user_id, []).append(report_record)

    return {
        "data": {
            "report_id": report_id,
            "status": "received",
            "platform": payload.platform or "web",
        },
        "report": report_record,
    }


@app.post("/api/extension/ping")
def extension_ping() -> dict:
    return {"data": {"ok": True}}
