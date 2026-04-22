"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Store, LogOut, Settings, LayoutDashboard, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderBoard } from "@/components/merchant/order-board"
import { StatsBar } from "@/components/merchant/stats-bar"
import { MenuManager } from "@/components/merchant/menu-manager"
import { useRealtimeOrders } from "@/hooks/use-realtime-orders"
import type { OrderStatus, MenuItem } from "@/lib/types"

export default function MerchantDashboard() {
  const router = useRouter()
  const { orders, loading, newOrderAlert, dismissAlert, refetch: refreshOrders } = useRealtimeOrders()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  
  // Verify auth on load
  useEffect(() => {
    const token = localStorage.getItem("merchant_token")
    if (!token) {
      router.push("/merchant")
    } else {
      fetchMenu()
    }
  }, [router])

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/merchant/menu")
      if (res.ok) {
        const json = await res.json()
        setMenuItems(json.data || [])
      }
    } catch {
      toast.error("Gagal memuat menu")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("merchant_token")
    router.push("/merchant")
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        toast.success(`Status diperbarui menjadi ${newStatus}`)
        // We don't need to manually update state here because useRealtimeOrders 
        // will pick up the postgres_changes event and update it automatically!
      } else {
        toast.error("Gagal update status")
      }
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  if (newOrderAlert) {
    // Show a visual flash on the screen
    toast("PESANAN BARU MASUK! 🛎️", {
      description: "Silakan cek kolom 'Menunggu'",
      duration: 5000,
      position: "top-center",
      className: "bg-primary text-primary-foreground border-none font-bold text-lg",
      onDismiss: dismissAlert,
      onAutoClose: dismissAlert,
    })
  }

  // Calculate daily stats
  const todayOrders = orders.filter(
    o => new Date(o.created_at).setHours(0,0,0,0) === new Date().setHours(0,0,0,0)
  )
  const totalRevenue = todayOrders
    .filter(o => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total_amount, 0)
  const pendingCount = orders.filter(o => o.status === "PENDING").length
  const preparingCount = orders.filter(o => o.status === "PREPARING").length

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between shrink-0 h-[60px]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-bold text-foreground">Merchant Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={refreshOrders} className="gap-2" disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive gap-2">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-6 max-h-[calc(100vh-60px)]">
        <Tabs defaultValue="orders" className="flex-1 flex flex-col">
          <TabsList className="w-fit mb-4 shrink-0">
            <TabsTrigger value="orders" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Pesanan
            </TabsTrigger>
            <TabsTrigger value="menu" className="gap-2">
              <Settings className="h-4 w-4" />
              Kelola Menu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
            <StatsBar 
              totalOrdersToday={todayOrders.length}
              totalRevenueToday={totalRevenue}
              pendingCount={pendingCount}
              preparingCount={preparingCount}
            />
            <OrderBoard 
              orders={orders} 
              loading={loading}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="menu" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
            <MenuManager items={menuItems} onRefresh={fetchMenu} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
