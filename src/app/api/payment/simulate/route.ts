import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

const XENDIT_BASE = "https://api.xendit.co"
const XENDIT_API_VERSION = "2022-07-31"

function xenditAuth() {
  const key = process.env.XENDIT_SECRET_KEY
  if (!key) throw new Error("XENDIT_SECRET_KEY is not set")
  return "Basic " + Buffer.from(key + ":").toString("base64")
}

const IS_MOCK_KEY =
  !process.env.XENDIT_SECRET_KEY ||
  process.env.XENDIT_SECRET_KEY.includes("YOUR_KEY_HERE")

/**
 * Simulate payment endpoint.
 *
 * Strategy: ALWAYS update the order status directly in Supabase right here
 * after firing the Xendit simulation request (or without it in mock mode).
 *
 * This bypasses the webhook completely, which is essential for:
 *  - Local development (Xendit can't reach localhost)
 *  - Demo / testing without a public tunnel
 *
 * In production with a real Xendit key + public URL, the webhook will also
 * fire and attempt the same update — which is idempotent and harmless.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qr_id, amount, order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 })
    }

    // ── Step 1: Optionally fire Xendit simulation (best-effort, never blocking) ─
    if (!IS_MOCK_KEY && qr_id && !qr_id.startsWith("QMEAL-")) {
      try {
        await fetch(
          `${XENDIT_BASE}/qr_codes/${encodeURIComponent(qr_id)}/payments/simulate`,
          {
            method: "POST",
            headers: {
              Authorization: xenditAuth(),
              "Content-Type": "application/json",
              "api-version": XENDIT_API_VERSION,
            },
            body: JSON.stringify({ amount }),
          }
        )
        // We intentionally ignore the response — the direct DB update below
        // is the authoritative source of truth for this simulation flow.
      } catch {
        // Non-fatal: Xendit call failed but we still proceed with the direct update
        console.warn("/api/payment/simulate: Xendit API call failed (non-fatal)")
      }
    }

    // ── Step 2: Directly update order → PREPARING (bypasses webhook entirely) ──
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: "PREPARING" })
      .eq("id", order_id)
      .select("id, status")
      .single()

    if (error || !updated) {
      console.error("/api/payment/simulate POST update error:", error)
      return NextResponse.json({ error: "Gagal memperbarui status pesanan" }, { status: 500 })
    }

    console.log(`/api/payment/simulate: Order ${order_id} → PREPARING (bypass mode)`)

    return NextResponse.json({
      success: true,
      order_id: updated.id,
      status: updated.status,
      message: "Simulasi berhasil — pesanan diteruskan ke dapur",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/payment/simulate POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
