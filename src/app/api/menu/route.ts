import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-server"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("/api/menu GET error:", error)
      return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
    }

    // Group by category
    const grouped: Record<string, typeof data> = {}
    for (const item of data) {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    }

    return NextResponse.json({ data, grouped })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/menu GET error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
