"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Lock, Store, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function MerchantLoginPage() {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect if already logged in
    const token = typeof window !== "undefined" ? localStorage.getItem("merchant_token") : null
    if (token) {
      router.push("/merchant/dashboard")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    setLoading(true)
    try {
      const res = await fetch("/api/merchant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })

      const json = await res.json()

      if (res.ok) {
        // Store token in simple localStorage for this prototype
        localStorage.setItem("merchant_token", json.data.token)
        toast.success("Login berhasil")
        router.push("/merchant/dashboard")
      } else {
        toast.error(json.error || "PIN salah")
        setPin("")
      }
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <div className="h-20 w-20 rounded-full bg-foreground flex items-center justify-center shadow-2xl shadow-foreground/10 animate-bounce-in">
          <Store className="h-10 w-10 text-background" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tight">FoodSnap Merchant</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.3em]">Operator Gateway</p>
        </div>
      </div>

      <Card className="w-full max-w-sm border-border/40 bg-card shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6 px-8">
          <CardTitle className="text-xl font-black tracking-tight">System Authentication</CardTitle>
          <CardDescription className="text-xs font-medium">Please enter your security PIN to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3 relative">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Access PIN</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••"
                  className="pl-12 h-14 text-center text-xl tracking-[0.5em] font-black bg-muted/20 border-border/50 rounded-2xl focus:bg-background focus:ring-primary/20 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-sm font-black uppercase tracking-widest bg-foreground hover:bg-primary text-background hover:text-primary-foreground rounded-2xl shadow-xl shadow-foreground/5 transition-all duration-300"
              disabled={loading || pin.length < 4}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Authorize Access"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-12 flex items-center gap-2 opacity-40">
        <div className="h-1 w-1 rounded-full bg-foreground" />
        <p className="text-[10px] uppercase font-black tracking-widest text-foreground">
          Internal Personnel Only
        </p>
        <div className="h-1 w-1 rounded-full bg-foreground" />
      </div>
    </div>
  )
}
