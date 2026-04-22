import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customer_email, customer_name, notes, items } = body

    // Validate required fields
    if (!customer_email || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Email and at least one item are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customer_email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Generate order number
    const { data: orderNumData, error: orderNumError } = await supabase.rpc(
      "generate_order_number"
    )

    if (orderNumError) {
      console.error("/api/orders POST - order number error:", orderNumError)
      // Fallback order number
    }

    const orderNumber =
      orderNumData || `ORD-${Date.now().toString(36).toUpperCase()}`

    // Calculate totals and validate items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Invalid item data" },
          { status: 400 }
        )
      }

      const subtotal = item.item_price * item.quantity
      totalAmount += subtotal

      orderItems.push({
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        item_price: item.item_price,
        quantity: item.quantity,
        subtotal,
      })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: customer_email.trim().toLowerCase(),
        customer_name: customer_name?.trim() || null,
        status: "PENDING",
        total_amount: totalAmount,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error("/api/orders POST - insert order error:", orderError)
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      )
    }

    // Create order items
    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsWithOrderId)

    if (itemsError) {
      console.error("/api/orders POST - insert items error:", itemsError)
      // Attempt to clean up the order
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { ...order, order_items: itemsWithOrderId },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/orders POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const today = searchParams.get("today")
    const merchantToken = req.headers.get("x-merchant-token")
    const apiKey = req.headers.get("x-api-key")

    // Simple merchant auth check or Arduino API key
    const isMerchant = !!merchantToken
    const isArduino = apiKey && apiKey === process.env.ARDUINO_API_KEY

    if (!isMerchant && !isArduino) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })

    if (today === "true") {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      query = query.gte("created_at", startOfDay.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error("/api/orders GET error:", error)
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/orders GET error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
