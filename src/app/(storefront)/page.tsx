"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSession, loadSession } from "@/lib/session"
import { UtensilsCrossed, Mail, User, ArrowRight, Loader2 } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [mode, setMode] = useState<"idle" | "email" | "loading">("idle")
  const [emailError, setEmailError] = useState("")
  const [mounted, setMounted] = useState(false)

  // On mount, check if there's a valid recent session stored and redirect straight in
  useEffect(() => {
    setMounted(true)
    try {
      const lastId = localStorage.getItem("qmeal_last_session")
      if (lastId) {
        const session = loadSession(lastId)
        // Session is valid for 8 hours
        if (session) {
          const age = Date.now() - new Date(session.createdAt).getTime()
          if (age < 8 * 60 * 60 * 1000) {
            router.replace(`/${lastId}`)
            return
          }
        }
      }
    } catch {
      // ignore
    }
  }, [router])

  const handleGuest = () => {
    setMode("loading")
    const session = createSession(null)
    try { localStorage.setItem("qmeal_last_session", session.id) } catch {}
    setTimeout(() => router.push(`/${session.id}`), 400)
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) { setEmailError("Masukkan email kamu"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Format email tidak valid")
      return
    }
    setMode("loading")
    const session = createSession(trimmed)
    try { localStorage.setItem("qmeal_last_session", session.id) } catch {}
    setTimeout(() => router.push(`/${session.id}`), 400)
  }

  if (!mounted) return null // avoid SSR mismatch

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--q-bg)",
        fontFamily: "var(--font-dm-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      {/* Card */}
      <div
        className="q-anim-slideup"
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--q-surface)",
          borderRadius: 28,
          border: "1px solid var(--q-border)",
          boxShadow: "var(--q-shadow)",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            background: "var(--q-text-primary)",
            padding: "32px 28px 28px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: 20,
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              border: "1.5px solid rgba(255,255,255,0.15)",
            }}
          >
            <UtensilsCrossed size={28} color="#fff" strokeWidth={1.6} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif)",
              fontSize: 30, fontWeight: 400, color: "#fff",
              letterSpacing: "-0.03em", lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            FoodSnap
          </h1>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>
            Pesan makanan favoritmu dengan mudah
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 28px 32px" }}>
          {mode === "loading" ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--q-accent)", margin: "0 auto" }} />
              <p style={{ marginTop: 12, fontSize: 14, color: "var(--q-text-muted)" }}>Menyiapkan sesi kamu...</p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: 15, fontWeight: 700, color: "var(--q-text-primary)",
                  marginBottom: 4, letterSpacing: "-0.01em",
                }}
              >
                Selamat datang! 👋
              </p>
              <p style={{ fontSize: 13, color: "var(--q-text-muted)", marginBottom: 24 }}>
                Masuk dengan email untuk menyimpan riwayat pesanan, atau lanjut sebagai tamu.
              </p>

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} style={{ marginBottom: 12 }}>
                <div style={{ position: "relative", marginBottom: emailError ? 6 : 12 }}>
                  <Mail
                    size={15}
                    color="var(--q-text-muted)"
                    style={{
                      position: "absolute", left: 14, top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="email@kamu.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError("") }}
                    style={{
                      width: "100%", padding: "13px 14px 13px 38px",
                      fontSize: 14, fontFamily: "inherit",
                      border: `1.5px solid ${emailError ? "#e55" : "var(--q-border)"}`,
                      borderRadius: 14, outline: "none",
                      background: "var(--q-bg)",
                      color: "var(--q-text-primary)",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => { if (!emailError) e.target.style.borderColor = "var(--q-accent)" }}
                    onBlur={(e) => { if (!emailError) e.target.style.borderColor = "var(--q-border)" }}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                {emailError && (
                  <p style={{ fontSize: 12, color: "#e55", marginBottom: 10, paddingLeft: 4 }}>
                    {emailError}
                  </p>
                )}

                <button
                  type="submit"
                  className="q-btn-press"
                  style={{
                    width: "100%", padding: "14px 20px",
                    background: "var(--q-text-primary)", color: "#fff",
                    border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    letterSpacing: "-0.01em",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
                  }}
                >
                  Masuk dengan Email
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Divider */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  margin: "16px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--q-border)" }} />
                <span style={{ fontSize: 12, color: "var(--q-text-muted)", fontWeight: 500 }}>atau</span>
                <div style={{ flex: 1, height: 1, background: "var(--q-border)" }} />
              </div>

              {/* Guest button */}
              <button
                onClick={handleGuest}
                className="q-btn-press"
                style={{
                  width: "100%", padding: "13px 20px",
                  background: "var(--q-bg)", color: "var(--q-text-secondary)",
                  border: "1.5px solid var(--q-border)", borderRadius: 14,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                <User size={15} />
                Lanjut sebagai Tamu
              </button>

              <p style={{ fontSize: 11.5, color: "var(--q-text-muted)", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
                Dengan melanjutkan, kamu menyetujui penggunaan data untuk keperluan layanan pesanan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
