from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4


BLOCK_THRESHOLD = 3
REPORT_THRESHOLD = 2
BLOCK_DURATION_MINUTES = 30


@dataclass
class InMemoryStore:
    messages: list[dict[str, Any]] = field(default_factory=list)
    reports: dict[str, set[str]] = field(default_factory=dict)
    users: dict[str, dict[str, Any]] = field(default_factory=dict)

    def _ensure_user(self, user_id: str) -> dict[str, Any]:
        if user_id not in self.users:
            self.users[user_id] = {
                "user_id": user_id,
                "offenses": 0,
                "blocked_until": None,
                "report_count": 0,
            }
        return self.users[user_id]

    def is_blocked(self, user_id: str) -> bool:
        user = self._ensure_user(user_id)
        blocked_until = user["blocked_until"]
        if blocked_until is None:
            return False
        return datetime.now(timezone.utc) < blocked_until

    def increment_offense(self, user_id: str) -> None:
        user = self._ensure_user(user_id)
        user["offenses"] += 1
        if user["offenses"] >= BLOCK_THRESHOLD:
            user["blocked_until"] = datetime.now(timezone.utc) + timedelta(minutes=BLOCK_DURATION_MINUTES)
            user["offenses"] = 0

    def create_message(self, author_id: str, text: str, moderation: dict[str, Any]) -> dict[str, Any]:
        self._ensure_user(author_id)
        message = {
            "id": str(uuid4()),
            "author_id": author_id,
            "text": text,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "flagged": moderation["flagged"],
            "moderation": moderation,
            "reports": 0,
        }
        self.messages.append(message)
        return message

    def report_message(self, reporter_id: str, message_id: str) -> dict[str, Any]:
        self._ensure_user(reporter_id)

        message = next((m for m in self.messages if m["id"] == message_id), None)
        if message is None:
            return {"ok": False, "error": "Message not found."}

        if message_id not in self.reports:
            self.reports[message_id] = set()

        if reporter_id in self.reports[message_id]:
            return {"ok": False, "error": "Already reported by this user."}

        self.reports[message_id].add(reporter_id)
        message["reports"] += 1

        if message["reports"] >= REPORT_THRESHOLD:
            author = self._ensure_user(message["author_id"])
            author["report_count"] += 1
            author["blocked_until"] = datetime.now(timezone.utc) + timedelta(minutes=BLOCK_DURATION_MINUTES)

        return {"ok": True, "message": message}

    def get_flagged_messages(self) -> list[dict[str, Any]]:
        return [m for m in self.messages if m["flagged"] or m["reports"] > 0]

    def get_users(self) -> list[dict[str, Any]]:
        users: list[dict[str, Any]] = []
        now = datetime.now(timezone.utc)
        for user in self.users.values():
            blocked_until = user["blocked_until"]
            users.append(
                {
                    "user_id": user["user_id"],
                    "offenses": user["offenses"],
                    "report_count": user["report_count"],
                    "is_blocked": blocked_until is not None and now < blocked_until,
                    "blocked_until": blocked_until.isoformat() if blocked_until else None,
                }
            )
        return users

    def get_user_state(self, user_id: str) -> dict[str, Any]:
        user = self._ensure_user(user_id)
        blocked_until = user["blocked_until"]
        now = datetime.now(timezone.utc)
        return {
            "user_id": user_id,
            "offenses": user["offenses"],
            "report_count": user["report_count"],
            "is_blocked": blocked_until is not None and now < blocked_until,
            "blocked_until": blocked_until.isoformat() if blocked_until else None,
        }


store = InMemoryStore()
