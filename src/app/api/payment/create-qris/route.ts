import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

const XENDIT_BASE = "https://api.xendit.co"
const XENDIT_API_VERSION = "2022-07-31"

function xenditAuth() {
  const key = process.env.XENDIT_SECRET_KEY
  if (!key) throw new Error("XENDIT_SECRET_KEY is not set")
  return "Basic " + Buffer.from(key + ":").toString("base64")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, cart, notes } = body

    if (!amount || !cart || cart.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const referenceId = `QMEAL-${Date.now()}`
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    // ── 1. Create order in Supabase first ─────────────────────────────────────
    const orderNumber = `QM-${Date.now().toString().slice(-6)}`
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "PENDING",
        total_amount: amount,
        notes: notes || null,
        customer_email: "guest@qmeal.local",
      })
      .select("id")
      .single()

    if (orderError) {
      console.error("/api/payment/create-qris POST order error:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // ── 2. Create order items ──────────────────────────────────────────────────
    const orderItems = cart.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menuItem.id,
      item_name: item.menuItem.name,
      item_price: item.menuItem.price,
      quantity: item.quantity,
      subtotal: item.menuItem.price * item.quantity,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("/api/payment/create-qris POST items error:", itemsError)
      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // ── 3. Create QRIS via Xendit API ─────────────────────────────────────────
    const xenditRes = await fetch(`${XENDIT_BASE}/qr_codes`, {
      method: "POST",
      headers: {
        Authorization: xenditAuth(),
        "Content-Type": "application/json",
        "api-version": XENDIT_API_VERSION,
      },
      body: JSON.stringify({
        reference_id: referenceId,
        type: "DYNAMIC",
        currency: "IDR",
        amount,
        // Store order_id in metadata for webhook reconciliation
        metadata: { order_id: order.id },
      }),
    })

    if (!xenditRes.ok) {
      const xenditErr = await xenditRes.json().catch(() => ({}))
      console.error("/api/payment/create-qris Xendit error:", xenditErr)

      // Fallback to mock QR for dev when key is a placeholder
      if (process.env.XENDIT_SECRET_KEY?.includes("YOUR_KEY_HERE")) {
        const qrData = `https://qmeal.local/pay/${referenceId}`
        return NextResponse.json({
          qr_string: qrData,
          qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`,
          external_id: referenceId,
          qr_id: referenceId, // mock — same as reference_id
          amount,
          expires_at: expiresAt,
          order_id: order.id,
          is_mock: true,
        })
      }

      await supabase.from("orders").delete().eq("id", order.id)
      return NextResponse.json(
        { error: xenditErr.message || "Failed to create QRIS payment" },
        { status: xenditRes.status }
      )
    }

    const qrCode = await xenditRes.json()

    // ── 4. Store qr_id in order for simulation & webhook lookup ───────────────
    await supabase
      .from("orders")
      .update({ external_payment_id: qrCode.id })
      .eq("id", order.id)

    return NextResponse.json({
      qr_string: qrCode.qr_string,
      qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode.qr_string)}`,
      external_id: referenceId,
      qr_id: qrCode.id, // e.g. "qr_abc123..." — needed for simulation
      amount,
      expires_at: expiresAt,
      order_id: order.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/payment/create-qris POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
