"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, UtensilsCrossed } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MenuGrid } from "@/components/customer/menu-grid"
import { CartSheet } from "@/components/customer/cart-sheet"
import { useCart } from "@/hooks/use-cart"
import type { MenuItem } from "@/lib/types"

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack"]

export default function MenuPage() {
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Semua")
  const [searchQuery, setSearchQuery] = useState("")

  const {
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
  } = useCart()

  const [lastActiveOrderId, setLastActiveOrderId] = useState<string | null>(null)

  useEffect(() => {
    // Read cached order ID
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("last_active_order")
      if (cached) setLastActiveOrderId(cached)
    }

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
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (item: MenuItem) => {
    addItem(item)
    toast.success(`${item.name} ditambahkan ke keranjang`, {
      duration: 1500,
    })
  }

  const handleOrderPlaced = (orderId: string) => {
    setLastActiveOrderId(orderId)
    router.push(`/order/${orderId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Q-Meal
                </h1>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                  Skip your line, not your meal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastActiveOrderId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  onClick={() => router.push(`/order/${lastActiveOrderId}`)}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Pesanan Aktif
                </Button>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Store Open
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search our curated menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/30 border-border/50 rounded-full focus:bg-background focus:ring-primary/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${activeCategory === cat
                    ? "bg-foreground text-background shadow-lg shadow-foreground/10"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/50 h-56 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <MenuGrid items={filteredItems} onAddToCart={handleAddToCart} />
        )}
      </main>

      {/* Cart FAB */}
      <CartSheet
        items={cartItems}
        totalItems={totalItems}
        totalAmount={totalAmount}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        onClearCart={clearCart}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  )
}
