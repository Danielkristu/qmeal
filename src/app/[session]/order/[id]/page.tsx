"use client"

import { use } from "react"
import { ArrowLeft, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { OrderTracker } from "@/components/customer/order-tracker"

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string; session: string }>
}) {
  const { id, session } = use(params)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--q-bg)",
        fontFamily: "var(--font-dm-sans)",
        paddingBottom: 100,
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "calc(max(20px, env(safe-area-inset-top)) + 36px) 20px 16px",
          background: "var(--q-bg)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--q-border)",
        }}
      >
        <Link href={`/${session}`}>
          <button
            className="q-btn-press"
            style={{
              width: 42, height: 42, borderRadius: 14,
              border: "1.5px solid var(--q-border)",
              background: "var(--q-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "var(--q-shadow-sm)",
            }}
            aria-label="Kembali ke menu"
          >
            <ArrowLeft size={18} color="var(--q-text-primary)" />
          </button>
        </Link>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif)",
              fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1,
              color: "var(--q-text-primary)",
            }}
          >
            Status Pesanan
          </h1>
          <p style={{ fontSize: 12, color: "var(--q-text-muted)", marginTop: 2 }}>
            Update real-time
          </p>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: "24px 20px" }}>
        <OrderTracker orderId={id} />
      </main>

      {/* Footer */}
      <div
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "center",
          background: "linear-gradient(to top, var(--q-bg) 70%, transparent)",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480, padding: "12px 20px 28px", pointerEvents: "auto" }}>
          <Link href={`/${session}`}>
            <button
              className="q-btn-press"
              style={{
                width: "100%", padding: "15px 20px",
                background: "var(--q-surface)", color: "var(--q-text-primary)",
                borderRadius: 18, border: "1.5px solid var(--q-border)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, letterSpacing: "-0.01em",
                boxShadow: "var(--q-shadow-sm)",
                fontFamily: "inherit",
              }}
            >
              <UtensilsCrossed size={16} />
              Pesan Lagi
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
