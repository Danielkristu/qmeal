"use client"

import { OrderCard } from "./order-card"
import type { OrderWithItems, OrderStatus } from "@/lib/types"

interface OrderBoardProps {
  orders: OrderWithItems[]
  loading: boolean
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void
}

export function OrderBoard({ orders, loading, onUpdateStatus }: OrderBoardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse h-[600px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card/50 rounded-xl border border-border/50" />
        ))}
      </div>
    )
  }

  const columns: { id: OrderStatus; title: string; color: string; bgColor: string }[] = [
    { id: "PREPARING", title: "Diproses", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { id: "READY", title: "Siap", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { id: "COMPLETED", title: "Selesai", color: "text-gray-500", bgColor: "bg-gray-500/10" },
  ]

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(
      (order) => order.status === status && (
        // Only show completed today
        status !== "COMPLETED" || 
        new Date(order.updated_at).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
      )
    ).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-140px)]">
      {columns.map((col) => {
        const columnOrders = getOrdersByStatus(col.id)
        return (
          <div key={col.id} className="flex flex-col h-full bg-muted/20 border border-border/50 rounded-xl overflow-hidden">
            <div className={`px-4 py-3 border-b border-border/50 ${col.bgColor} flex justify-between items-center`}>
              <h3 className={`font-semibold ${col.color}`}>{col.title}</h3>
              <span className="text-xs font-bold bg-background/50 px-2 py-0.5 rounded-full text-foreground">
                {columnOrders.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
              {columnOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
              {columnOrders.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-10">
                  Tidak ada pesanan
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
