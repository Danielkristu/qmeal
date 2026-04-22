"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { OrderTimeline } from "./order-timeline"
import { useOrderStatus } from "@/hooks/use-order-status"
import { ORDER_STATUS_CONFIG } from "@/lib/types"
import type { OrderWithItems } from "@/lib/types"

interface OrderTrackerProps {
  orderId: string
}

export function OrderTracker({ orderId }: OrderTrackerProps) {
  const { status, isConnected, justBecameReady } = useOrderStatus(orderId)
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (res.ok) {
          const json = await res.json()
          setOrder(json.data)
        }
      } catch (err) {
        console.error("Failed to fetch order:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  // Utility to play a "Ding!" sound without needing external MP3 files
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime)
        
        // Volume envelope (fade in quick, fade out smooth)
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(ctx.currentTime + startTime)
        osc.stop(ctx.currentTime + startTime + duration)
      }

      // Play a lovely two-tone "ding-ding" (C6 -> G6)
      playNote(1046.50, 0, 0.5)
      playNote(1567.98, 0.15, 0.8)
    } catch (e) {
      console.error("Audio could not be played", e)
    }
  }

  // Vibrate + sound + notify when order transitions to READY
  useEffect(() => {
    if (!justBecameReady) return

    // 1. Try vibrating (Works on Android/Windows, ignored on iOS)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([400, 100, 200, 100, 400])
    }

    // 2. Play sound alternative (Works everywhere if user has interacted with page)
    playChimeSound()

    // 3. Visual notification
    toast("🎉 Your order is ready!", {
      description: "Head to the counter and pick it up.",
      duration: 8000,
      style: {
        background: "#059669",
        color: "#fff",
        border: "none",
      },
    })
  }, [justBecameReady])

  const handleConfirmPickup = async () => {
    setConfirming(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      if (res.ok) {
        toast.success("Pesanan selesai! Selamat menikmati.")
        if (typeof window !== "undefined") {
          localStorage.removeItem("last_active_order")
        }
      } else {
        toast.error("Gagal mengonfirmasi pesanan.")
      }
    } catch {
      toast.error("Terjadi kesalahan.")
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="text-5xl">😕</span>
        <p className="text-muted-foreground">Pesanan tidak ditemukan</p>
      </div>
    )
  }

  const currentStatus = status || order.status
  const statusConfig = ORDER_STATUS_CONFIG[currentStatus]

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Connection status */}
      <div className="flex justify-center">
        <div
          className={`px-3 py-1 rounded-full border border-border/40 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
            isConnected
              ? "bg-emerald-500/5 text-emerald-600"
              : "bg-amber-500/5 text-amber-600"
          }`}
        >
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3 animate-pulse" />
          )}
          {isConnected ? "Live Updates Active" : "Connecting..."}
        </div>
      </div>

      {/* Main status card */}
      <Card className="border-border/40 overflow-hidden bg-card shadow-2xl shadow-primary/5">
        <div
          className={`h-1.5 w-full ${
            currentStatus === "READY"
              ? "bg-emerald-500 animate-status-glow"
              : currentStatus === "PREPARING"
                ? "bg-primary"
                : currentStatus === "COMPLETED"
                  ? "bg-muted-foreground/30"
                  : currentStatus === "CANCELLED"
                    ? "bg-destructive"
                    : "bg-amber-500"
          }`}
        />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">
              Reference Number
            </p>
            <h2 className="text-4xl font-black font-mono text-foreground tracking-tighter">
              #{order.order_number}
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pb-10 px-8">
          {/* Status Timeline */}
          <div className="py-4">
            <OrderTimeline currentStatus={currentStatus} />
          </div>

          {/* Current status message */}
          <div className="text-center space-y-2">
            <p className={`text-xl font-black tracking-tight ${statusConfig.color.includes('emerald') ? 'text-emerald-600' : 'text-foreground'}`}>
              {statusConfig.label}
            </p>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[240px] mx-auto">
              {statusConfig.description}
            </p>
          </div>

          {currentStatus === "READY" && (
            <div className="text-center animate-bounce-in space-y-6 bg-emerald-50/50 dark:bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20">
              <div className="space-y-2">
                <span className="text-5xl">🎁</span>
                <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">
                  Ready for Collection
                </p>
              </div>
              <Button 
                onClick={handleConfirmPickup} 
                disabled={confirming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-3 font-bold transition-all h-14 rounded-xl"
              >
                {confirming ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    Confirm Picked Up
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator className="opacity-50" />

          {/* Order details */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest text-center">
              Order Details
            </h3>

            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground font-medium">
                    {item.item_name} <span className="text-foreground/40 mx-1">×</span> {item.quantity}
                  </span>
                  <span className="text-foreground font-bold">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="opacity-50" />

            <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Grand Total</span>
              <span className="text-xl font-black text-primary">
                Rp {order.total_amount.toLocaleString("id-ID")}
              </span>
            </div>

            {order.notes && (
              <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/20 text-xs text-center italic">
                <p className="text-muted-foreground leading-relaxed">"{order.notes}"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
