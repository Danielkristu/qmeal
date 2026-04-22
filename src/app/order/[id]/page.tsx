"use client"

import { use } from "react"
import { ArrowLeft, UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrderTracker } from "@/components/customer/order-tracker"

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-black text-foreground tracking-tight">
                Order Tracking
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Real-time Status
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-6 py-8">
        <OrderTracker orderId={id} />
      </main>

      {/* Footer: Order again */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-lg mx-auto">
          <Link href="/">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl gap-3 border-border/60 font-bold hover:bg-muted transition-all"
            >
              <UtensilsCrossed className="h-4 w-4" />
              Place Another Order
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
