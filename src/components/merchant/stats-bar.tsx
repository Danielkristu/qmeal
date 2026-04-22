"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BellRing, ChefHat, CheckCircle, Ticket } from "lucide-react"

interface StatsBarProps {
  totalOrdersToday: number
  totalRevenueToday: number
  pendingCount: number
  preparingCount: number
}

export function StatsBar({ totalOrdersToday, totalRevenueToday, pendingCount, preparingCount }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      <Card className="p-4 flex items-center gap-4 bg-amber-500/5 hover:bg-amber-500/10 transition-colors border-amber-500/20">
        <div className="p-3 bg-amber-500/20 text-amber-600 rounded-lg">
          <BellRing className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Menunggu</p>
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-blue-500/20">
        <div className="p-3 bg-blue-500/20 text-blue-600 rounded-lg">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Diproses</p>
          <p className="text-2xl font-bold text-foreground">{preparingCount}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors border-emerald-500/20">
        <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-lg">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Selesai Hari Ini</p>
          <p className="text-2xl font-bold text-foreground">{totalOrdersToday - pendingCount - preparingCount}</p>
        </div>
      </Card>

      <Card className="p-4 flex items-center gap-4 bg-primary/5 hover:bg-primary/10 transition-colors border-primary/20">
        <div className="p-3 bg-primary/20 text-primary rounded-lg">
          <Ticket className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Pendapatan Hari Ini</p>
          <p className="text-xl font-bold text-foreground truncate max-w-[120px]">
            {totalRevenueToday >= 1000000 
              ? `Rp ${(totalRevenueToday / 1000000).toFixed(1)}M` 
              : `Rp ${(totalRevenueToday / 1000).toFixed(0)}k`
            }
          </p>
        </div>
      </Card>
    </div>
  )
}
