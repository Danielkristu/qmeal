"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CartProvider } from "@/context/cart-context"
import { loadSession } from "@/lib/session"
import type { ReactNode } from "react"

interface SessionLayoutProps {
  children: ReactNode
  params: Promise<{ session: string }>
}

export default function SessionLayout({ children, params }: SessionLayoutProps) {
  const { session } = use(params)
  const router = useRouter()
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Validate the session ID exists in localStorage
    const info = loadSession(session)
    if (!info) {
      // Invalid session — send back to login
      router.replace("/")
      return
    }
    setValid(true)
  }, [session, router])

  // Show nothing while validating (prevents flash of content)
  if (valid === null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--q-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid var(--q-border)",
            borderTop: "3px solid var(--q-accent)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <CartProvider sessionId={session}>
      {children}
    </CartProvider>
  )
}
