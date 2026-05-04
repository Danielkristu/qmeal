/**
 * Session utilities — generates & persists per-user session IDs.
 * Each session has an isolated cart stored under `qmeal_cart_{sessionId}`.
 */

export interface SessionInfo {
  id: string           // UUID v4
  email: string | null // null = guest
  name: string         // display name (email prefix or "Guest")
  createdAt: string    // ISO timestamp
}

const SESSION_PREFIX = "qmeal_session_"

// ── Generate a UUID v4 (no external dependency) ─────────────────────────────

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ── Create a new session ─────────────────────────────────────────────────────

export function createSession(email: string | null): SessionInfo {
  const id = uuid()
  const session: SessionInfo = {
    id,
    email,
    name: email ? email.split("@")[0] : "Tamu",
    createdAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(`${SESSION_PREFIX}${id}`, JSON.stringify(session))
  } catch {
    // Private browsing — still return the session object
  }
  return session
}

// ── Load a session by ID ─────────────────────────────────────────────────────

export function loadSession(id: string): SessionInfo | null {
  try {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${id}`)
    if (!raw) return null
    return JSON.parse(raw) as SessionInfo
  } catch {
    return null
  }
}

// ── Cart storage key scoped to session ───────────────────────────────────────

export function cartKey(sessionId: string): string {
  return `qmeal_cart_${sessionId}`
}
