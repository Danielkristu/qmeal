"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/hooks/use-cart"
import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react"

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID")
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = { Makanan: "🍜", Minuman: "🥤", Snack: "🍟" }
  return map[category] || "🍽️"
}

export default function CartPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const router = useRouter()
  const { items: cart, updateQuantity, clearCart, totalAmount: subtotal } = useCart()
  const [notes, setNotes] = useState("")

  const serviceFee = 1000
  const total = subtotal + serviceFee

  const handleCheckout = () => {
    sessionStorage.setItem("qmeal_cart", JSON.stringify(cart))
    sessionStorage.setItem("qmeal_total", String(total))
    sessionStorage.setItem("qmeal_notes", notes)
    sessionStorage.setItem("qmeal_session", session)
    router.push(`/${session}/checkout`)
  }

  // ── Shared header style ───────────────────────────────────────────────────
  const headerStyle = {
    padding: "calc(max(20px, env(safe-area-inset-top)) + 36px) 20px 16px",
    background: "var(--q-bg)",
    display: "flex",
    alignItems: "center",
    gap: 14,
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  }

  const backBtnStyle = {
    width: 42, height: 42, borderRadius: 14,
    border: "1.5px solid var(--q-border)",
    background: "var(--q-surface)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: "var(--q-shadow-sm)",
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--q-bg)", fontFamily: "var(--font-dm-sans)" }}>
        <div style={headerStyle}>
          <button onClick={() => router.push(`/${session}`)} className="q-btn-press" style={backBtnStyle}>
            <ArrowLeft size={18} color="var(--q-text-primary)" />
          </button>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Keranjang
          </h1>
        </div>
        <div className="q-anim-fadein" style={{ textAlign: "center", padding: "72px 32px", color: "var(--q-text-muted)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--q-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <ShoppingBag size={36} strokeWidth={1.4} color="var(--q-border)" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--q-text-secondary)", marginBottom: 6 }}>Keranjang kosong</p>
          <p style={{ fontSize: 13, marginBottom: 28 }}>Tambahkan menu favoritmu!</p>
          <button
            onClick={() => router.push(`/${session}`)}
            className="q-btn-press"
            style={{ padding: "12px 28px", borderRadius: 100, background: "var(--q-text-primary)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Lihat Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--q-bg)", fontFamily: "var(--font-dm-sans)", paddingBottom: 110 }}>
      {/* Header */}
      <div style={headerStyle}>
        <button onClick={() => router.push(`/${session}`)} className="q-btn-press" style={backBtnStyle} aria-label="Kembali">
          <ArrowLeft size={18} color="var(--q-text-primary)" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Pesanan Saya
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--q-text-muted)", marginTop: 2 }}>
            {cart.reduce((s, i) => s + i.quantity, 0)} item · {fmt(total)}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="q-btn-press"
          style={{ fontSize: 13, color: "#e55", background: "none", border: "1px solid #fdd", borderRadius: 10, padding: "6px 12px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
        >
          Hapus
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "4px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Cart Items */}
        <div style={{ background: "var(--q-surface)", borderRadius: 20, border: "1px solid var(--q-border)", padding: "16px", boxShadow: "var(--q-shadow-card)" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--q-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            🛒 Item Pesanan · {cart.reduce((s, i) => s + i.quantity, 0)} item
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cart.map((item, i) => (
              <div key={item.menuItem.id} className="q-anim-slideup"
                style={{ animationDelay: `${i * 0.05}s`, display: "flex", gap: 12, alignItems: "center", padding: "12px", borderRadius: 18, border: "1px solid #f0f0f0", background: "#fafaf8" }}
              >
                <div style={{ position: "relative", width: 62, height: 62, borderRadius: 14, overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", background: "var(--q-bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.menuItem.image_url ? (
                    <Image src={item.menuItem.image_url} alt={item.menuItem.name} fill style={{ objectFit: "cover" }} unoptimized />
                  ) : (
                    <span style={{ fontSize: 24 }}>{getCategoryEmoji(item.menuItem.category)}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--q-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                    {item.menuItem.name}
                  </p>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "var(--q-accent)", marginTop: 3 }}>
                    {fmt(item.menuItem.price * item.quantity)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                  <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #ebebeb", background: item.quantity === 1 ? "#fff0f0" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    aria-label="Kurangi"
                  >
                    {item.quantity === 1 ? <Trash2 size={11} color="var(--q-accent)" /> : <Minus size={11} color="var(--q-text-primary)" strokeWidth={2.5} />}
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 800, minWidth: 18, textAlign: "center", color: "var(--q-text-primary)" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--q-text-primary)", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    aria-label="Tambah"
                  >
                    <Plus size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: "var(--q-surface)", borderRadius: 20, border: "1px solid var(--q-border)", padding: "16px", boxShadow: "var(--q-shadow-card)" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "var(--q-text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>📝 Catatan</p>
          <textarea
            placeholder="Contoh: jangan pedas, kurangi gula..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", borderRadius: 14, border: "1.5px solid var(--q-border)", background: "#fafaf8", padding: "12px 14px", fontSize: 13.5, fontFamily: "var(--font-dm-sans)", color: "var(--q-text-primary)", resize: "none", outline: "none", transition: "border-color 0.2s" }}
            onFocus={(e) => { e.target.style.borderColor = "var(--q-accent)" }}
            onBlur={(e) => { e.target.style.borderColor = "var(--q-border)" }}
          />
        </div>

        {/* Summary */}
        <div style={{ background: "var(--q-surface)", borderRadius: 20, border: "1px solid var(--q-border)", padding: "16px 16px 14px", boxShadow: "var(--q-shadow-card)" }}>
          {[["Subtotal", fmt(subtotal)], ["Biaya layanan", fmt(serviceFee)]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: "var(--q-text-secondary)" }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--q-text-primary)" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px dashed #ebebeb", marginTop: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--q-accent)", letterSpacing: "-0.02em" }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", background: "linear-gradient(to top, var(--q-bg) 70%, transparent)", pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 480, padding: "12px 20px 32px", pointerEvents: "auto" }}>
          <button
            onClick={handleCheckout}
            className="q-btn-press"
            style={{ width: "100%", padding: "17px 20px", background: "var(--q-text-primary)", color: "#fff", borderRadius: 18, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "-0.02em", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
          >
            Bayar Sekarang
            <span style={{ opacity: 0.6, fontSize: 14 }}>· {fmt(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
