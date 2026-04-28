"use client"

// Re-export from CartContext so all existing `useCart()` imports work unchanged.
// The actual state is managed by CartProvider in the root layout, which means
// cart items are shared across all pages and survive navigation.
export { useCartContext as useCart } from "@/context/cart-context"
