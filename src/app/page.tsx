"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCart } from "@/hooks/use-cart"
import type { MenuItem } from "@/lib/types"

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack"]

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Makanan: "🍜",
    Minuman: "🥤",
    Snack: "🍟",
  }
  return map[category] || "🍽️"
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID")
}

export default function MenuPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Semua")

  const { items: cartItems, addItem, totalItems, totalAmount } = useCart()

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch("/api/menu")
        if (res.ok) {
          const json = await res.json()
          setMenuItems(json.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err)
        toast.error("Gagal memuat menu")
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  const filteredItems = menuItems.filter((item) => {
    return activeCategory === "Semua" || item.category === activeCategory
  })

  const handleAddToCart = (item: MenuItem) => {
    addItem(item)
    toast.success(`${item.name} ditambahkan`, { duration: 1500 })
  }

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={styles.page}>

        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>SmartCanteen</h1>
            <p style={styles.headerSubtitle}>Pesan tanpa antre</p>
          </div>
          <div style={styles.storeBadge}>
            <span style={styles.storeDot} />
            Buka
          </div>
        </header>

        {/* Categories */}
        <div className="hide-scrollbar" style={styles.tabsWrap}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat ? styles.tabActive : styles.tabInactive}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <main style={styles.main}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
              Memuat menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>
              Tidak ada menu di kategori ini.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} style={styles.menuRow}>
                <div style={styles.itemEmoji}>{getCategoryEmoji(item.category)}</div>
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.name}</p>
                  <p style={styles.itemDesc}>{item.description}</p>
                  <p style={styles.itemPrice}>{fmt(item.price)}</p>
                </div>
                <button onClick={() => handleAddToCart(item)} style={styles.addBtn}>
                  +
                </button>
              </div>
            ))
          )}
          <div style={{ height: 100 }} />
        </main>

        {/* Cart CTA */}
        {totalItems > 0 && (
          <div style={styles.ctaWrap}>
            <button onClick={() => router.push("/cart")} style={styles.ctaBtn}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={styles.ctaBadge}>{totalItems}</span>
                <span>Lihat Keranjang</span>
              </div>
              <span style={styles.ctaPrice}>{fmt(totalAmount)}</span>
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F7F5F0; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  button { cursor: pointer; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F7F5F0", position: "relative" },

  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 20px 16px", background: "#F7F5F0",
    position: "sticky", top: 0, zIndex: 20,
  },
  headerTitle: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#1A1A18", marginBottom: 2 },
  headerSubtitle: { fontSize: 12, color: "#888", letterSpacing: "0.02em" },
  storeBadge: { display: "flex", alignItems: "center", gap: 6, background: "#E8F5E9", color: "#2E7D32", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase" },
  storeDot: { width: 6, height: 6, borderRadius: 3, background: "#4CAF50" },

  tabsWrap: { display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 16px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" },
  tabActive: { background: "#1A1A18", color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 },
  tabInactive: { background: "#fff", color: "#888", border: "1px solid #EDEBE4", borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 },

  main: { padding: "0 20px" },

  menuRow: {
    display: "flex", alignItems: "center", gap: 14,
    background: "#fff", borderRadius: 16, border: "1px solid #EDEBE4",
    padding: "14px", marginBottom: 12,
  },
  itemEmoji: { fontSize: 28, width: 56, height: 56, background: "#F5F3EE", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1A18", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemDesc: { fontSize: 12, color: "#888", marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  itemPrice: { fontSize: 13, fontWeight: 700, color: "#C8702A" },
  addBtn: { width: 36, height: 36, borderRadius: 12, background: "#1A1A18", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },

  ctaWrap: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 390, zIndex: 30 },
  ctaBtn: { width: "100%", background: "#1A1A18", color: "#fff", border: "none", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer", boxShadow: "0 8px 24px rgba(26,26,24,0.25)" },
  ctaBadge: { background: "#C8702A", color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 700 },
  ctaPrice: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 },
}
