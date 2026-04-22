"use client"

import { useState } from "react"
import { ShoppingBag, X, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CartItemRow } from "./cart-item"
import type { CartItem } from "@/lib/types"

interface CartSheetProps {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onRemove: (menuItemId: string) => void
  onClearCart: () => void
  onOrderPlaced: (orderId: string) => void
}

export function CartSheet({
  items,
  totalItems,
  totalAmount,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  onOrderPlaced,
}: CartSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const handleSubmitOrder = async () => {
    if (!email.trim()) {
      toast.error("Email wajib diisi")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Format email tidak valid")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: email,
          customer_name: name || undefined,
          notes: notes || undefined,
          items: items.map((item) => ({
            menu_item_id: item.menuItem.id,
            item_name: item.menuItem.name,
            item_price: item.menuItem.price,
            quantity: item.quantity,
          })),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || "Gagal membuat pesanan")
        return
      }

      toast.success("Pesanan berhasil dibuat! 🎉")
      onClearCart()
      setEmail("")
      setName("")
      setNotes("")
      setShowCheckout(false)
      setIsOpen(false)
      // Save order ID to local storage as reference
      if (typeof window !== "undefined") {
        localStorage.setItem("last_active_order", json.data.id)
      }
      onOrderPlaced(json.data.id)
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-8 right-8 h-14 rounded-full shadow-2xl shadow-primary/20 bg-foreground hover:bg-primary text-background hover:text-primary-foreground z-50 transition-all duration-500 hover:scale-110 active:scale-95 px-6 gap-3 group"
          disabled={totalItems === 0}
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground h-5 min-w-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-foreground group-hover:border-primary transition-colors">
                {totalItems}
              </span>
            )}
          </div>
          <span className="font-bold tracking-tight">View Cart</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 border-l-border/50 bg-background">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black tracking-tight">
              {showCheckout ? "Finalize Order" : "Your Cart"}
            </SheetTitle>
            {!showCheckout && items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={onClearCart}
              >
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-5">
            <span className="text-5xl">🛒</span>
            <p className="text-muted-foreground text-sm">
              Keranjang masih kosong
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Lihat Menu
            </Button>
          </div>
        ) : showCheckout ? (
          /* Checkout Form */
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Untuk menerima konfirmasi pesanan
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Catatan{" "}
                <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Contoh: pedas level 3, tanpa bawang..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Order summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Ringkasan Pesanan</h4>
              {items.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>
                    {item.menuItem.name} × {item.quantity}
                  </span>
                  <span>
                    Rp{" "}
                    {(item.menuItem.price * item.quantity).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Cart Items */
          <div className="flex-1 overflow-y-auto px-5">
            {items.map((item) => (
              <CartItemRow
                key={item.menuItem.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}

        {/* Bottom bar */}
        {items.length > 0 && (
          <div className="border-t border-border/40 p-6 space-y-4 bg-background">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-black text-foreground">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
            </div>

            {showCheckout ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-border/50 hover:bg-muted font-bold"
                  onClick={() => setShowCheckout(false)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button
                  className="flex-[2] h-12 rounded-xl bg-primary hover:primary-600 text-primary-foreground gap-2 font-bold shadow-lg shadow-primary/20"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Place Order
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full h-14 rounded-2xl bg-foreground hover:bg-primary text-background hover:text-primary-foreground gap-3 text-base font-black tracking-tight shadow-xl shadow-foreground/5 transition-all duration-300"
                onClick={() => setShowCheckout(true)}
              >
                Continue to Checkout
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
