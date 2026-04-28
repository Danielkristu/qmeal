import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

// Dedicated lightweight endpoint for Arduino/ESP32 polling
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key")

    // Hardware auth check
    if (apiKey !== process.env.ARDUINO_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get today's orders using the same logic
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, order_number, status") // ONLY fetch what we need for minimum JSON size
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: true }) // Oldest first

    if (error) throw error

    // Filter into groups
    const pendingOrders = orders.filter((o) => o.status === "PENDING")
    const preparingOrders = orders.filter((o) => o.status === "PREPARING")
    const readyOrders = orders.filter((o) => o.status === "READY")

    // Provide lists for scrolling support
    const pendingList = pendingOrders.map(o => ({ id: o.id, num: o.order_number.split("-").pop() }))
    const preparingList = preparingOrders.map(o => ({ id: o.id, num: o.order_number.split("-").pop() }))

    // 3. Get the latest PREPARING order with full details for printing
    // We only take the most recent one to keep the payload small.
    // The Arduino can track if it has already printed this ID locally.
    const { data: latestPreparing } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("status", "PREPARING")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const receipt = latestPreparing ? {
      id: latestPreparing.id,
      n: latestPreparing.order_number,
      i: latestPreparing.order_items.map((item: any) => `${item.quantity}x ${item.item_name}`).join("|"),
      t: latestPreparing.total_amount,
      nt: latestPreparing.notes || "",
      ts: latestPreparing.updated_at
    } : null

    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

    // Provide a compressed payload optimized for low-memory microcontrollers
    return NextResponse.json({
      t: timeStr,
      q_count: pendingList.length,
      p_count: preparingList.length,
      pending: pendingList,
      preparing: preparingList,
      rdy_nums: readyOrders.map(o => o.order_number.split("-").pop()).join(",") || "NONE",
      receipt: receipt // The Arduino checks if this ID changed and prints if so
    })
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/arduino/queue GET error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
