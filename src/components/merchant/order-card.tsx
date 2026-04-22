"use client"

import { Clock, MessageSquare, UtensilsCrossed } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { OrderWithItems, OrderStatus } from "@/lib/types"

interface OrderCardProps {
  order: OrderWithItems
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void
}

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const timeFormatted = format(new Date(order.created_at), "HH:mm", {
    locale: id,
  })

  // Determine next status
  const getNextStatus = (): OrderStatus | null => {
    switch (order.status) {
      case "PENDING":
        return "PREPARING"
      case "PREPARING":
        return "READY"
      case "READY":
        return "COMPLETED"
      default:
        return null
    }
  }

  const nextStatus = getNextStatus()

  return (
    <Card 
      className={`animate-slide-up cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
        order.status === 'PENDING' ? 'border-l-amber-500 hover:border-l-amber-400' :
        order.status === 'PREPARING' ? 'border-l-blue-500 hover:border-l-blue-400' :
        order.status === 'READY' ? 'border-l-emerald-500 hover:border-l-emerald-400' :
        'border-l-gray-500'
      }`}
      onClick={() => nextStatus && onUpdateStatus(order.id, nextStatus)}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
        <div>
          <h4 className="font-bold font-mono text-sm">{order.order_number}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {timeFormatted}
            {order.customer_name && (
              <>
                <span className="mx-1">•</span>
                {order.customer_name}
              </>
            )}
          </p>
        </div>
        <Badge variant={order.status === 'PENDING' ? 'default' : 'secondary'} className="text-[10px]">
          Rp {order.total_amount.toLocaleString("id-ID")}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-3">
        <ul className="space-y-1 mt-2 mb-2">
          {order.order_items.map((item) => (
            <li key={item.id} className="text-sm flex items-start gap-1.5">
              <span className="font-semibold text-primary">{item.quantity}x</span>
              <span className="text-foreground leading-tight">{item.item_name}</span>
            </li>
          ))}
        </ul>

        {order.notes && (
          <>
            <Separator className="my-2" />
            <div className="flex items-start gap-1.5 p-1.5 bg-amber-500/10 text-amber-600 rounded-md text-xs">
              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
              <p className="font-medium leading-tight">{order.notes}</p>
            </div>
          </>
        )}

        {nextStatus && (
          <div className="mt-3 text-xs text-center text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 font-medium bg-muted/30 py-1 rounded-md">
            Click to set {nextStatus}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
