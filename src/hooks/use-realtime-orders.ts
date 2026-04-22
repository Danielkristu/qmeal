"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase-client"
import type { OrderWithItems } from "@/lib/types"

/**
 * Merchant-side hook: subscribes to ALL order changes via Supabase Realtime
 */
export function useRealtimeOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      const token = localStorage.getItem("merchant_token")
      const res = await fetch("/api/orders?today=true", {
        headers: {
          "x-merchant-token": token || "",
        },
      })
      if (res.ok) {
        const json = await res.json()
        setOrders(json.data || [])
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczIj+dxN6/eTAnSZK90NsxDCBVn7bMwHksIkGSq72lZzZDeLmwnVJAcqKkkHReS4OmnYBuVU+BoJZ3eGVKdpOciX1uZ2Z4k5uBd2tpYXOGiHh5cWVhYG50dnV0cW5tbm5wcnJxcHBwcHFxcXFxcHBwcHBxcXFxcXBw")
      }
      audioRef.current.play().catch(() => {})
    } catch {
      // Audio not available
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    // Subscribe to all order changes
    const channel = supabase
      .channel("merchant-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        () => {
          // New order received — refetch all orders for full data with items
          fetchOrders()
          setNewOrderAlert(true)
          playNotificationSound()
          // Clear alert after 5 seconds
          setTimeout(() => setNewOrderAlert(false), 5000)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          // Update the specific order in state
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          )
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders, playNotificationSound])

  const dismissAlert = useCallback(() => {
    setNewOrderAlert(false)
  }, [])

  return {
    orders,
    loading,
    newOrderAlert,
    dismissAlert,
    isConnected,
    refetch: fetchOrders,
  }
}
