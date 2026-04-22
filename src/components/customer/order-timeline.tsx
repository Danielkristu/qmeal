"use client"

import { CheckCircle, Clock, CookingPot, PackageCheck, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/types"
import { ORDER_STATUS_CONFIG, ORDER_STATUS_FLOW } from "@/lib/types"

interface OrderTimelineProps {
  currentStatus: OrderStatus
}

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-5 w-5" />,
  PREPARING: <CookingPot className="h-5 w-5" />,
  READY: <CheckCircle className="h-5 w-5" />,
  COMPLETED: <PackageCheck className="h-5 w-5" />,
  CANCELLED: <XCircle className="h-5 w-5" />,
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  if (currentStatus === "CANCELLED") {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <div className="h-16 w-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-500 animate-bounce-in">
          <XCircle className="h-8 w-8" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-red-500">Pesanan Dibatalkan</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pesanan ini telah dibatalkan
          </p>
        </div>
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus)

  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto py-6 px-2">
      {ORDER_STATUS_FLOW.map((status, index) => {
        const config = ORDER_STATUS_CONFIG[status]
        const isActive = index <= currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === ORDER_STATUS_FLOW.length - 1

        return (
          <div key={status} className="flex items-center flex-1 last:flex-0">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-2 relative">
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isCurrent && "animate-pulse-ring",
                  isActive
                    ? `${config.bgColor} ${config.color} border-current`
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {statusIcons[status]}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center absolute -bottom-5 whitespace-nowrap",
                  isActive ? config.color : "text-muted-foreground"
                )}
              >
                {config.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1.5 relative overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary transition-all duration-700 ease-out rounded-full",
                    index < currentIndex ? "w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
