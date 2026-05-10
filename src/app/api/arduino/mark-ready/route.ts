import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

/**
 * Arduino/ESP32 endpoint for updating order status via keypad.
 * 
 * Authentication: X-API-Key header matching ARDUINO_API_KEY env var
 * 
 * Body:
 *   { "code": "1234" }     — The 4-digit numeric part of the order (e.g. from QM-1234)
 */
export async function POST(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key")
    if (!apiKey || apiKey !== process.env.ARDUINO_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    let code = body.code

    if (!code) {
      return NextResponse.json(
        { error: 'Provide "code" in the request body (e.g., "1234")' },
        { status: 400 }
      )
    }

    // Ensure code is a string and trim whitespace
    code = String(code).trim()

    // 1. Find the active order (PENDING or PREPARING) that ends with this code
    // We only look at recent orders to avoid conflicts with old orders
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, order_number")
      .gte("created_at", startOfDay.toISOString())
      .in("status", ["PENDING", "PREPARING"])
      .like("order_number", `%${code}`)
      .order("created_at", { ascending: true })

    if (fetchError) {
      console.error("/api/arduino/mark-ready POST fetch error:", fetchError)
      return NextResponse.json(
        { error: "Failed to query orders" },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "No active order found with that code" },
        { status: 404 }
      )
    }

    // If there are multiple, we pick the oldest active one
    const targetOrder = orders[0]

    // 2. Update the status to READY
    const { data, error: updateError } = await supabase
      .from("orders")
      .update({ status: "READY", updated_at: new Date().toISOString() })
      .eq("id", targetOrder.id)
      .select()
      .single()

    if (updateError) {
      console.error("/api/arduino/mark-ready POST update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Order ${targetOrder.order_number} marked as READY`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/arduino/mark-ready POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
