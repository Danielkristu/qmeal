"use client"

import { Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { MenuItem } from "@/lib/types"

interface MenuCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
}

// Map category to emoji
function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Makanan: "🍜",
    Minuman: "🥤",
    Snack: "🍟",
  }
  return map[category] || "🍽️"
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/40 bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      {/* Image area - Minimalist visual */}
      <div className="relative h-44 bg-muted/20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="text-5xl drop-shadow-sm transition-transform duration-700 group-hover:scale-110">
          {getCategoryEmoji(item.category)}
        </span>

        {/* Category badge - Minimalist */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className="bg-background/80 backdrop-blur-md text-[10px] uppercase tracking-widest font-bold border-none px-2.5 py-0.5"
          >
            {item.category}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors duration-300">
            {item.name}
          </h3>
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 mt-1 font-medium">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Price</span>
            <span className="text-base font-black text-foreground">
              Rp {item.price.toLocaleString("id-ID")}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onAddToCart(item)}
            className="h-10 w-10 rounded-full p-0 bg-foreground hover:bg-primary text-background hover:text-primary-foreground shadow-xl shadow-foreground/5 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
