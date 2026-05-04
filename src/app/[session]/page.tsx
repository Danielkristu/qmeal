"use client"

import { use, useEffect, useState, useMemo } from "react"
import { Search, ShoppingBag, MapPin, ChevronDown, Sparkles, X, Plus, Check, Minus, Star, Flame, LogOut } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { MenuItem } from "@/lib/types"
import { loadSession } from "@/lib/session"

// ─── Category Config ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "Semua", name: "Semua", emoji: "✦" },
  { id: "Makanan", name: "Makanan", emoji: "🍜" },
  { id: "Minuman", name: "Minuman", emoji: "🥤" },
  { id: "Snack", name: "Snack", emoji: "🍟" },
]

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID")
}

// ─── MenuCard ─────────────────────────────────────────────────────────────────

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const { items: cartItems, addItem, updateQuantity } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const cartEntry = cartItems.find((i) => i.menuItem.id === item.id)
  const qty = cartEntry?.quantity ?? 0

  const handleAdd = () => {
    addItem(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div
      className="q-anim-slideup q-card-hover"
      style={{
        animationDelay: `${index * 0.05}s`,
        background: "var(--q-surface)",
        borderRadius: 20,
        border: "1px solid var(--q-border)",
        overflow: "hidden",
        boxShadow: "var(--q-shadow-card)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area */}
      <div
        style={{
          position: "relative",
          paddingTop: "70%",
          background: "var(--q-bg-subtle)",
          overflow: "hidden",
        }}
      >
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}
          >
            {item.category === "Makanan" ? "🍜" : item.category === "Minuman" ? "🥤" : "🍟"}
          </div>
        )}

        {/* Category label */}
        <div
          style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            borderRadius: 8, padding: "3px 8px",
            fontSize: 10, fontWeight: 700,
            color: "var(--q-text-muted)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
          }}
        >
          {item.category}
        </div>

        {/* Badges */}
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, flexDirection: "column" }}>
          {item.is_featured && (
            <div style={{ background: "#fef3c7", borderRadius: 8, padding: "3px 7px", display: "flex", alignItems: "center", gap: 3 }}>
              <Flame size={9} color="#f59e0b" />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#d97706" }}>Populer</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p
          style={{
            fontSize: 13.5, fontWeight: 700, color: "var(--q-text-primary)",
            letterSpacing: "-0.01em", lineHeight: 1.25, marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}
        >
          {item.name}
        </p>

        {item.description && (
          <p
            style={{
              fontSize: 11.5, color: "var(--q-text-muted)", lineHeight: 1.4,
              marginBottom: 10, flex: 1,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {item.description}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--q-text-primary)", letterSpacing: "-0.02em" }}>
            {fmt(item.price)}
          </span>

          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className="q-btn-press"
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: justAdded ? "#22c55e" : "var(--q-text-primary)",
                color: "#fff", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              aria-label={`Tambah ${item.name}`}
            >
              {justAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => updateQuantity(item.id, qty - 1)}
                className="q-btn-press"
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  border: "1.5px solid var(--q-border)",
                  background: qty === 1 ? "#fff0f0" : "var(--q-surface)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Kurangi"
              >
                <Minus size={10} strokeWidth={2.5} color={qty === 1 ? "var(--q-accent)" : "var(--q-text-primary)"} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: "center" }}>
                {qty}
              </span>
              <button
                onClick={() => updateQuantity(item.id, qty + 1)}
                className="q-btn-press"
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "var(--q-text-primary)", color: "#fff",
                  border: "none", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}
                aria-label="Tambah"
              >
                <Plus size={10} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const router = useRouter()
  const { items: cartItems, totalItems, totalAmount } = useCart()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Semua")
  const [query, setQuery] = useState("")
  const [userName, setUserName] = useState<string>("Tamu")

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return `Selamat pagi 🌤️`
    if (h < 17) return `Selamat siang 👋`
    return `Selamat sore 🌙`
  })()

  // Load user display name
  useEffect(() => {
    try {
      const { loadSession } = require("@/lib/session")
      const info = loadSession(session)
      if (info) setUserName(info.name)
    } catch {}
  }, [session])

  // Fetch menu items
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menu")
        if (res.ok) {
          const json = await res.json()
          setMenuItems(json.data ?? [])
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  const filtered = useMemo(() => {
    let list = menuItems
    if (activeCategory !== "Semua") list = list.filter((i) => i.category === activeCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)
      )
    }
    return list
  }, [menuItems, activeCategory, query])

  const handleLogout = () => {
    try { localStorage.removeItem("qmeal_last_session") } catch {}
    router.push("/")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--q-bg)",
        fontFamily: "var(--font-dm-sans)",
        paddingBottom: totalItems > 0 ? 120 : 40,
        overflowX: "hidden",
      }}
    >
      {/* ── HEADER ─────────────────────────────────── */}
      <header
        style={{
          padding: "calc(max(20px, env(safe-area-inset-top)) + 36px) 20px 8px",
          background: "var(--q-bg)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Location row */}
        <div
          className="q-anim-slideup"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "var(--q-surface)", border: "1px solid var(--q-border)",
              borderRadius: 100, padding: "6px 12px 6px 10px",
              boxShadow: "var(--q-shadow-sm)",
            }}
          >
            <MapPin size={13} color="var(--q-accent)" strokeWidth={2.5} />
            <span style={{ fontSize: 12.5, color: "var(--q-text-secondary)", fontWeight: 600 }}>
              SmartCanteen · Lantai 1
            </span>
            <ChevronDown size={12} color="var(--q-text-muted)" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="q-btn-press"
            title="Keluar / ganti sesi"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "var(--q-surface)", border: "1px solid var(--q-border)",
              borderRadius: 100, padding: "6px 12px",
              fontSize: 12, fontWeight: 600, color: "var(--q-text-muted)",
              cursor: "pointer", boxShadow: "var(--q-shadow-sm)",
            }}
          >
            <LogOut size={11} />
            {userName}
          </button>
        </div>

        {/* Title + Cart */}
        <div
          className="q-anim-slideup q-d1"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}
        >
          <div>
            <p style={{ fontSize: 13, color: "var(--q-text-muted)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.01em" }}>
              {greeting}
            </p>
            <h1
              style={{
                fontFamily: "var(--font-dm-serif)",
                fontSize: 33, fontWeight: 400, lineHeight: 1.1,
                color: "var(--q-text-primary)", letterSpacing: "-0.03em",
              }}
            >
              Mau makan
              <br />
              <span style={{ fontStyle: "italic", color: "var(--q-accent)" }}>apa</span>{" "}
              hari ini?
            </h1>
          </div>

          {/* Cart icon */}
          <button
            onClick={() => router.push(`/${session}/cart`)}
            className="q-btn-press"
            style={{
              position: "relative", width: 48, height: 48, borderRadius: 16,
              background: "var(--q-surface)", border: "1px solid var(--q-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, marginTop: 4,
              boxShadow: "var(--q-shadow-sm)",
            }}
            aria-label="Buka keranjang"
          >
            <ShoppingBag size={20} color="var(--q-text-primary)" strokeWidth={1.8} />
            {totalItems > 0 && (
              <span
                className="q-anim-bouncein"
                style={{
                  position: "absolute", top: -7, right: -7,
                  background: "var(--q-accent)", color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  width: 20, height: 20, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--q-bg)", letterSpacing: "-0.02em",
                }}
              >
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div
          className="q-anim-slideup q-d2"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--q-surface)", border: "1.5px solid var(--q-border)",
            borderRadius: 16, padding: "13px 16px",
            boxShadow: "var(--q-shadow-sm)", transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--q-accent)"
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(232,115,74,0.12)"
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--q-border)"
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = "var(--q-shadow-sm)"
          }}
        >
          <Search size={16} color="var(--q-text-muted)" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari menu, makanan, minuman..."
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 14, color: "var(--q-text-primary)",
              background: "transparent", fontFamily: "var(--font-dm-sans)", fontWeight: 500,
            }}
            aria-label="Cari menu"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "var(--q-border)", border: "none", borderRadius: "50%",
                width: 20, height: 20, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", flexShrink: 0,
              }}
            >
              <X size={11} color="var(--q-text-secondary)" />
            </button>
          )}
        </div>
      </header>

      {/* ── CATEGORY PILLS ────────────────────────── */}
      <div className="q-anim-slideup q-d3 q-no-scroll" style={{ padding: "14px 0 4px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 7, padding: "0 20px", width: "max-content" }}>
          {CATEGORIES.map((cat, i) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="q-btn-press"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 17px", borderRadius: 100,
                  fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  whiteSpace: "nowrap" as const, cursor: "pointer",
                  border: "1.5px solid",
                  transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  borderColor: isActive ? "var(--q-text-primary)" : "var(--q-border)",
                  background: isActive ? "var(--q-text-primary)" : "var(--q-surface)",
                  color: isActive ? "#fff" : "var(--q-text-secondary)",
                  fontFamily: "inherit",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.15)" : "var(--q-shadow-sm)",
                  animationDelay: `${i * 0.05 + 0.18}s`,
                }}
              >
                <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SECTION HEADER ───────────────────────── */}
      <div style={{ padding: "16px 20px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--q-text-primary)", letterSpacing: "-0.02em" }}>
            {activeCategory === "Semua"
              ? "Semua Menu"
              : CATEGORIES.find((c) => c.id === activeCategory)?.name}
          </h2>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color: "var(--q-text-muted)",
              background: "var(--q-bg-subtle)", padding: "2px 8px",
              borderRadius: 100, border: "1px solid var(--q-border)",
            }}
          >
            {loading ? "..." : filtered.length}
          </span>
        </div>
        {activeCategory === "Semua" && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--q-accent)", fontSize: 12.5, fontWeight: 600 }}>
            <Sparkles size={13} />
            Chef&apos;s picks
          </div>
        )}
      </div>

      {/* ── MENU GRID ────────────────────────────── */}
      <div style={{ padding: "6px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {loading ? (
          // Skeleton loading
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--q-border)" }}>
              <div className="q-skeleton" style={{ paddingTop: "70%", borderRadius: 0 }} />
              <div style={{ padding: "12px 12px 14px" }}>
                <div className="q-skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 8 }} />
                <div className="q-skeleton" style={{ height: 11, width: "60%", borderRadius: 8 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="q-anim-fadein" style={{ gridColumn: "1/-1", textAlign: "center", padding: "72px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.5 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--q-text-secondary)", marginBottom: 5 }}>
              Tidak ditemukan
            </p>
            <p style={{ fontSize: 13, color: "var(--q-text-muted)" }}>Coba kata kunci lain</p>
            <button
              onClick={() => { setQuery(""); setActiveCategory("Semua") }}
              className="q-btn-press"
              style={{
                marginTop: 20, padding: "10px 22px", borderRadius: 100,
                background: "var(--q-text-primary)", color: "#fff",
                border: "none", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Reset filter
            </button>
          </div>
        ) : (
          filtered.map((item, i) => (
            <MenuCard key={item.id} item={item} index={i} />
          ))
        )}
      </div>

      {/* ── STICKY CART BAR ──────────────────────── */}
      {totalItems > 0 && (
        <div
          className="q-anim-slideup"
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
            display: "flex", justifyContent: "center",
            background: "linear-gradient(to top, var(--q-bg) 70%, transparent)",
            pointerEvents: "none",
          }}
        >
          <div style={{ width: "100%", maxWidth: 480, padding: "12px 20px 30px", pointerEvents: "auto" }}>
            <button
              onClick={() => router.push(`/${session}/cart`)}
              className="q-btn-press"
              style={{
                width: "100%", padding: "16px 20px",
                background: "var(--q-text-primary)", color: "#fff",
                borderRadius: 18, border: "none",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                letterSpacing: "-0.02em",
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
              }}
            >
              <span
                style={{
                  background: "rgba(255,255,255,0.15)", borderRadius: 10,
                  width: 28, height: 28, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}
              >
                {totalItems}
              </span>
              <span>Lihat Keranjang</span>
              <span style={{ opacity: 0.6, fontSize: 14 }}>{fmt(totalAmount)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
