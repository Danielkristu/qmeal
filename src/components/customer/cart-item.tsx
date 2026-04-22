"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CartItem } from "@/lib/types"

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onRemove: (menuItemId: string) => void
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground truncate">
          {item.menuItem.name}
        </h4>
        <p className="text-xs text-muted-foreground">
          Rp {item.menuItem.price.toLocaleString("id-ID")} × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() =>
            onUpdateQuantity(item.menuItem.id, item.quantity - 1)
          }
        >
          <Minus className="h-3 w-3" />
        </Button>

        <span className="w-6 text-center text-sm font-semibold tabular-nums">
          {item.quantity}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() =>
            onUpdateQuantity(item.menuItem.id, item.quantity + 1)
          }
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-primary whitespace-nowrap w-20 text-right">
          Rp {(item.menuItem.price * item.quantity).toLocaleString("id-ID")}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onRemove(item.menuItem.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
