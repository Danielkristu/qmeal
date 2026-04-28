import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("order_id")
    const externalId = searchParams.get("external_id")

    if (!orderId && !externalId) {
      return NextResponse.json(
        { error: "order_id or external_id is required" },
        { status: 400 }
      )
    }

    let query = supabase.from("orders").select("id, status")

    if (orderId) {
      query = query.eq("id", orderId)
    } else {
      query = query.eq("external_payment_id", externalId as string)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: order.status,
      order_id: order.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/payment/status GET error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
