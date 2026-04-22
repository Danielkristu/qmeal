import { NextResponse, NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, price, category, image_url, is_available, sort_order } = body

    if (!name || price === undefined || !category) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        name: name.trim(),
        description: (description || "").trim(),
        price: Math.round(Number(price)),
        category: category.trim(),
        image_url: image_url || null,
        is_available: is_available !== false,
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error("/api/merchant/menu POST error:", error)
      return NextResponse.json({ error: "Failed to add menu item" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/merchant/menu POST error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 })
    }

    const allowedFields: Record<string, unknown> = {}
    if (updates.name !== undefined) allowedFields.name = updates.name.trim()
    if (updates.description !== undefined) allowedFields.description = updates.description.trim()
    if (updates.price !== undefined) allowedFields.price = Math.round(Number(updates.price))
    if (updates.category !== undefined) allowedFields.category = updates.category.trim()
    if (updates.image_url !== undefined) allowedFields.image_url = updates.image_url || null
    if (updates.is_available !== undefined) allowedFields.is_available = updates.is_available
    if (updates.sort_order !== undefined) allowedFields.sort_order = updates.sort_order

    allowedFields.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("menu_items")
      .update(allowedFields)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("/api/merchant/menu PATCH error:", error)
      return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/merchant/menu PATCH error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required" }, { status: 400 })
    }

    // Soft delete — set is_available to false
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("/api/merchant/menu DELETE error:", error)
      return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/merchant/menu DELETE error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("/api/merchant/menu GET error:", error)
      return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("/api/merchant/menu GET error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
