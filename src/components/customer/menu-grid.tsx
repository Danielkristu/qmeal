"use client"

import { MenuCard } from "./menu-card"
import type { MenuItem } from "@/lib/types"

interface MenuGridProps {
  items: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}

export function MenuGrid({ items, onAddToCart }: MenuGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
          <span className="text-4xl grayscale opacity-50">🍽️</span>
        </div>
        <h3 className="text-xl font-bold text-foreground tracking-tight">
          No items found
        </h3>
        <p className="text-xs text-muted-foreground mt-2 max-w-[200px] leading-relaxed font-medium">
          We couldn't find any menu items matching your selection at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <MenuCard item={item} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  )
}
