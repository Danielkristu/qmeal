"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase-client"
import type { OrderStatus } from "@/lib/types"

/**
 * Customer-side hook: subscribes to a single order's status changes via Supabase Realtime.
 * Exposes `justBecameReady` which is true for one render cycle when status transitions to READY.
 */
export function useOrderStatus(orderId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [justBecameReady, setJustBecameReady] = useState(false)
  const prevStatusRef = useRef<OrderStatus | null>(null)

  const fetchCurrentStatus = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("status, updated_at")
      .eq("id", orderId)
      .single()

    if (!error && data) {
      setStatus(data.status as OrderStatus)
      setUpdatedAt(data.updated_at)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId) return

    // Fetch initial status
    fetchCurrentStatus()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newRecord = payload.new as { status: OrderStatus; updated_at: string }
          const incoming = newRecord.status
          // Detect transition to READY
          if (incoming === "READY" && prevStatusRef.current !== "READY") {
            setJustBecameReady(true)
          }
          prevStatusRef.current = incoming
          setStatus(incoming)
          setUpdatedAt(newRecord.updated_at)
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, fetchCurrentStatus])

  // Reset justBecameReady after one cycle so it doesn't re-fire
  useEffect(() => {
    if (justBecameReady) {
      const t = setTimeout(() => setJustBecameReady(false), 100)
      return () => clearTimeout(t)
    }
  }, [justBecameReady])

  return { status, updatedAt, isConnected, justBecameReady }
}
