import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

/**
 * Xendit QR Code Payment Webhook
 * Configure in Xendit Dashboard → Settings → Callbacks → QR Code
 * URL: https://yourdomain.com/api/payment/webhook
 *
 * Xendit sends a POST with X-Callback-Token header for verification.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Verify Xendit webhook token ────────────────────────────────────────────
    const callbackToken = req.headers.get("x-callback-token")
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN

    if (expectedToken && expectedToken !== "YOUR_WEBHOOK_VERIFICATION_TOKEN") {
      if (!callbackToken || callbackToken !== expectedToken) {
        console.warn("/api/payment/webhook: Invalid callback token")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const payload = await req.json()
    console.log("/api/payment/webhook received:", JSON.stringify(payload, null, 2))

    // Xendit QR payment callback shape:
    // { event: "qr.payment", data: { reference_id, status, amount, metadata: { order_id } } }
    const event = payload.event as string | undefined
    const data = payload.data ?? payload // some older versions send flat payload

    // Extract fields — handle both nested and flat structures
    const referenceId: string = data.reference_id ?? payload.reference_id ?? ""
    const status: string = data.status ?? payload.status ?? ""
    const metadata = data.metadata ?? {}
    const orderId: string = metadata.order_id ?? ""

    // Map Xendit status → our OrderStatus
    let newStatus: string | null = null
    if (status === "SUCCEEDED" || status === "COMPLETED" || status === "SETTLED") {
      newStatus = "PREPARING" // Payment confirmed → kitchen starts preparing
    } else if (status === "FAILED" || status === "EXPIRED") {
      newStatus = "CANCELLED"
    }

    if (!newStatus) {
      // Unhandled event/status — acknowledge without error
      return NextResponse.json({ received: true })
    }

    // Try to find the order by metadata.order_id first (most reliable)
    if (orderId) {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)

      if (error) {
        console.error("/api/payment/webhook update by order_id error:", error)
      } else {
        console.log(`/api/payment/webhook: Order ${orderId} → ${newStatus}`)
        return NextResponse.json({ received: true })
      }
    }

    // Fallback: look up by external_payment_id (reference_id or qr_id)
    if (referenceId) {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("external_payment_id", referenceId)

      if (error) {
        console.error("/api/payment/webhook update by external_payment_id error:", error)
      } else {
        console.log(`/api/payment/webhook: Order by ref ${referenceId} → ${newStatus}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/payment/webhook POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
