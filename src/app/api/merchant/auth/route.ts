import { NextResponse, NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pin } = body

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 })
    }

    const correctPin = process.env.MERCHANT_PIN

    if (!correctPin) {
      console.error("/api/merchant/auth - MERCHANT_PIN not configured")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    if (pin !== correctPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
    }

    // Generate a simple session token
    const token = Buffer.from(
      `merchant:${correctPin}:${Date.now()}`
    ).toString("base64")

    return NextResponse.json({
      data: { token, store_name: "Food Order Store" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/merchant/auth POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
