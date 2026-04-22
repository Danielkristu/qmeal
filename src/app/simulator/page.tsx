"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase-client"
import { ChevronUp, ChevronDown } from "lucide-react"

export default function ArduinoSimulator() {
  const [pending, setPending] = useState<any[]>([])
  const [preparing, setPreparing] = useState<any[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  const [time, setTime] = useState("00:00:00")
  const [rdyNums, setRdyNums] = useState("")
  const [loading, setLoading] = useState(true)
  
  const fetchActiveOrders = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ARDUINO_API_KEY || "your-secret-arduino-key"
      const res = await fetch("/api/arduino/queue", {
        headers: {
          "x-api-key": apiKey
        }
      })
      
      if (res.ok) {
        const json = await res.json()
        setPending(json.pending || [])
        setPreparing(json.preparing || [])
        setTime(json.t || "00:00:00")
        setRdyNums(json.rdy_nums || "NONE")
        setErrorStatus(null)
        
        // Clamp index if queue shrinks
        setSelectedIdx(prev => {
          if (json.pending?.length === 0) return 0
          return Math.min(prev, (json.pending?.length || 1) - 1)
        })
      } else {
        if (res.status === 401) setErrorStatus("401 AUTH ERR")
        else setErrorStatus(`ERR ${res.status}`)
      }
    } catch (err) {
      console.error("Simulator fetch error:", err)
      setErrorStatus("CON ERR")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveOrders()

    const channel = supabase
      .channel("arduino-realtime-sim")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchActiveOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActiveOrders])

  // Hardware Action: Scroll
  const handleScroll = (dir: 'up' | 'down') => {
    if (pending.length <= 1) return
    if (dir === 'up') {
      setSelectedIdx(prev => (prev - 1 + pending.length) % pending.length)
    } else {
      setSelectedIdx(prev => (prev + 1) % pending.length)
    }
  }

  // Hardware Action: Take Order (Pending -> Preparing)
  const handleTakeOrder = async () => {
    if (pending.length === 0) return
    const targetOrder = pending[selectedIdx]

    try {
      await fetch(`/api/orders/${targetOrder.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ARDUINO_API_KEY || "your-secret-arduino-key"
        },
        body: JSON.stringify({ status: "PREPARING" })
      })
      setSelectedIdx(0) // Reset to top
    } catch(err) {
      console.error("Take order simulation failed", err)
    }
  }

  // Hardware Action: Ready (Preparing -> Ready)
  const handleSetReady = async () => {
    if (preparing.length === 0) return
    const targetOrder = preparing[0] // Always set first in prep list to ready

    try {
      await fetch(`/api/orders/${targetOrder.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ARDUINO_API_KEY || "your-secret-arduino-key"
        },
        body: JSON.stringify({ status: "READY" })
      })
    } catch(err) {
      console.error("Ready status simulation failed", err)
    }
  }

  // LCD Line Construction
  const line1 = errorStatus 
    ? `!! ${errorStatus} !!`.padEnd(20, " ")
    : `T:${time} Q:${pending.length.toString().padStart(2, '0')}      `.substring(0, 20)
  
  const line2 = pending.length > 0 
    ? `>NXT:${pending[selectedIdx].num} [${selectedIdx+1}/${pending.length}]`.padEnd(20, " ")
    : " NXT: NONE         "
    
  const line3 = preparing.length > 0
    ? ` PRP:${preparing[0].num}`.padEnd(20, " ")
    : " PRP: NONE         "
    
  const line4 = ` RDY:${rdyNums}`.substring(0, 20).padEnd(20, " ")

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-foreground font-sans">
      
      <div className="text-center mb-12 space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-foreground">ARDUINO CORE</h1>
        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] opacity-60">Selection & Protocol v2.5</p>
      </div>

      <div className="bg-muted/30 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-primary/5 border border-border/40 w-full max-w-lg">
        
        {/* LCD DISPLAY - Modernized Retro */}
        <div className="mb-10 p-6 bg-[#0a0f0a] border-[16px] border-neutral-900 rounded-2xl shadow-[inset_0_4px_20px_rgba(0,0,0,1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#00ff44] opacity-[0.02] pointer-events-none group-hover:opacity-[0.04] transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ff44]/5 to-transparent h-4 w-full animate-scanline pointer-events-none" />
          <pre className="font-mono text-xl leading-relaxed text-[#55ff55] drop-shadow-[0_0_8px_rgba(85,255,85,0.4)] whitespace-pre tracking-[0.18em] selection:bg-transparent">
{line1}
{line2}
{line3}
{line4}
          </pre>
        </div>

        {/* SCROLL BUTTONS - Refined */}
        <div className="flex justify-center gap-8 mb-12">
          <button 
            onClick={() => handleScroll('up')}
            className="w-20 h-20 rounded-full bg-muted border-b-[6px] border-border flex items-center justify-center hover:bg-background hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all shadow-xl shadow-foreground/5"
            title="Scroll Up"
          >
            <ChevronUp className="h-10 w-10 text-muted-foreground" />
          </button>
          <button 
            onClick={() => handleScroll('down')}
            className="w-20 h-20 rounded-full bg-muted border-b-[6px] border-border flex items-center justify-center hover:bg-background hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all shadow-xl shadow-foreground/5"
            title="Scroll Down"
          >
            <ChevronDown className="h-10 w-10 text-muted-foreground" />
          </button>
        </div>

        {/* ACTION BUTTONS - Minimalist Strong */}
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleTakeOrder}
              disabled={pending.length === 0}
              className={`h-28 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:shadow-none active:translate-y-2 transition-all outline-none border-b-8 ${
                pending.length > 0 
                ? 'bg-orange-500 text-white border-orange-700 hover:bg-orange-400' 
                : 'bg-muted/50 text-muted-foreground border-border/50 cursor-not-allowed opacity-50'
              }`}
            >
              Take Order
            </button>
            <span className="text-[9px] uppercase font-black text-center text-muted-foreground tracking-widest opacity-40">PIN 04 / INTERRUPT</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleSetReady}
              disabled={preparing.length === 0}
              className={`h-28 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:shadow-none active:translate-y-2 transition-all outline-none border-b-8 ${
                preparing.length > 0 
                ? 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-400' 
                : 'bg-muted/50 text-muted-foreground border-border/50 cursor-not-allowed opacity-50'
              }`}
            >
              Order Ready
            </button>
            <span className="text-[9px] uppercase font-black text-center text-muted-foreground tracking-widest opacity-40">PIN 16 / SIGNAL</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex justify-between items-center text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span>SYSLINK ACTIVE</span>
          </div>
          <span className="opacity-40">ESP32_CORE_V2</span>
        </div>
      </div>
    </div>
  )
}
