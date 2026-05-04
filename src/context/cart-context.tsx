"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { CartItem, MenuItem } from "@/lib/types"
import { cartKey } from "@/lib/session"

// ─── Context shape ────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[]
  addItem: (menuItem: MenuItem) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalAmount: number
  sessionId: string | null
}

const CartContext = createContext<CartContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────────────

interface CartProviderProps {
  children: ReactNode
  sessionId?: string   // When provided, cart is scoped to this session
}

export function CartProvider({ children, sessionId }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // The key changes when sessionId changes, so cart is fully isolated
  const storageKey = sessionId ? cartKey(sessionId) : "qmeal_cart_global"

  // Rehydrate from localStorage on mount / sessionId change
  useEffect(() => {
    setHydrated(false)
    setItems([])   // Clear previous session's items immediately
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // Silently ignore corrupt storage
    } finally {
      setHydrated(true)
    }
  }, [storageKey])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      // Silently ignore storage errors (e.g. private browsing quota)
    }
  }, [items, hydrated, storageKey])

  const addItem = useCallback((menuItem: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { menuItem, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId))
  }, [])

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.menuItem.id === menuItemId ? { ...i, quantity } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount = items.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        sessionId: sessionId ?? null,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCartContext must be used inside <CartProvider>")
  }
  return ctx
}
