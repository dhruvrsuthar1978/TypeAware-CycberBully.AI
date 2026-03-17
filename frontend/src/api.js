import { API_BASE_URL } from "./utils/config";

export async function moderateText(text) {
  const res = await fetch(`${API_BASE_URL}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Moderation request failed");
  return res.json();
}

export async function sendMessage(authorId, text) {
  const res = await fetch(`${API_BASE_URL}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author_id: authorId, text }),
  });
  if (!res.ok) throw new Error("Send message failed");
  return res.json();
}

export async function reportMessage(reporterId, messageId) {
  const res = await fetch(`${API_BASE_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reporter_id: reporterId, message_id: messageId }),
  });
  if (!res.ok) throw new Error("Report failed");
  return res.json();
}

export async function fetchFlaggedMessages() {
  const res = await fetch(`${API_BASE_URL}/admin/flags`);
  if (!res.ok) throw new Error("Fetch flags failed");
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/admin/users`);
  if (!res.ok) throw new Error("Fetch users failed");
  return res.json();
}
