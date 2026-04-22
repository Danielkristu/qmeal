import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

const STATUS_FLOW = ["PENDING", "PREPARING", "READY", "COMPLETED"]

/**
 * Arduino/ESP32 endpoint for updating order status.
 * 
 * Authentication: X-API-Key header matching ARDUINO_API_KEY env var
 * 
 * Body options:
 *   { "status": "PREPARING" }     — set a specific status
 *   { "action": "next" }          — advance to the next status in the flow
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.ARDUINO_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    let newStatus = body.status

    // If action is "next", advance to the next status
    if (body.action === "next") {
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", id)
        .single()

      if (fetchError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const currentIndex = STATUS_FLOW.indexOf(order.status)
      if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
        return NextResponse.json(
          { error: "Order cannot be advanced further" },
          { status: 400 }
        )
      }

      newStatus = STATUS_FLOW[currentIndex + 1]
    }

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Provide either "status" or "action": "next"' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("/api/orders/[id]/status PATCH error:", error)
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      message: `Order status updated to ${newStatus}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/orders/[id]/status PATCH error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
