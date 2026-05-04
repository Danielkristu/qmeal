"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QRISPayment {
  qr_string: string;
  qr_image_url: string;
  external_id: string;
  qr_id: string;          // Xendit qr_codes id — needed for simulation
  order_id: string;       // Our Supabase order id
  amount: number;
  expires_at: string;
  is_mock?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params);
  const router = useRouter();

  const [payment, setPayment] = useState<QRISPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [total, setTotal] = useState(0);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);

  // ── Read session on client side ───────────────────────────────────────────

  useEffect(() => {
    const t = Number(sessionStorage.getItem("qmeal_total") ?? 0);
    setTotal(t);
  }, []);

  // ── Create QRIS on mount (after total is set) ─────────────────────────────

  useEffect(() => {
    if (total === 0) return;

    async function createQRIS() {
      try {
        setLoading(true);
        const res = await fetch("/api/payment/create-qris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            cart: JSON.parse(sessionStorage.getItem("qmeal_cart") ?? "[]"),
            notes: sessionStorage.getItem("qmeal_notes") ?? "",
          }),
        });

        if (!res.ok) throw new Error("Gagal membuat pembayaran");
        const data: QRISPayment = await res.json();
        setPayment(data);

        // Countdown timer
        const expiry = new Date(data.expires_at).getTime();
        const tick = () => {
          const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
          setSecondsLeft(diff);
          if (diff > 0) setTimeout(tick, 1000);
        };
        tick();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    createQRIS();
  }, [total]);

  // ── Poll payment status every 3s ─────────────────────────────────────────

  useEffect(() => {
    if (!payment || polling) return;

    const interval = setInterval(async () => {
      try {
        // Poll by order_id (reliable — works even for mock mode)
        const url = payment.order_id
          ? `/api/payment/status?order_id=${payment.order_id}`
          : `/api/payment/status?external_id=${payment.external_id}`;

        const res = await fetch(url);
        if (!res.ok) return;
        const { status, order_id } = await res.json();

        if (
          status === "PREPARING" ||
          status === "COMPLETED" ||
          status === "SETTLED"
        ) {
          clearInterval(interval);
          // Clear cart from localStorage
          localStorage.removeItem(`qmeal_cart_${session}`);
          sessionStorage.removeItem("qmeal_cart");
          sessionStorage.removeItem("qmeal_total");
          sessionStorage.removeItem("qmeal_notes");
          router.push(`/${session}/order/${order_id}`);
        } else if (status === "CANCELLED" || status === "FAILED" || status === "EXPIRED") {
          clearInterval(interval);
          setError("Pembayaran gagal atau kedaluwarsa.");
        }
      } catch {
        // Silent — keep polling
      }
    }, 3000);

    setPolling(true);
    return () => clearInterval(interval);
  }, [payment, polling, router, session]);

  // ── Simulate payment ─────────────────────────────────────────────────────

  const handleSimulate = async () => {
    if (!payment || simulating || simSuccess) return;
    setSimulating(true);
    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_id: payment.qr_id,
          amount: payment.amount,
          order_id: payment.order_id,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || "Simulasi gagal");
      }

      // The simulate API directly updated the order — no need to wait for
      // the polling loop. Redirect immediately to the order tracking page.
      setSimSuccess(true);

      // Clear cart storage before navigating
      localStorage.removeItem(`qmeal_cart_${session}`);
      sessionStorage.removeItem("qmeal_cart");
      sessionStorage.removeItem("qmeal_total");
      sessionStorage.removeItem("qmeal_notes");

      // Short visual delay so user sees the success state before redirect
      setTimeout(() => {
        router.push(`/${session}/order/${json.order_id ?? payment.order_id}`);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulasi gagal");
    } finally {
      setSimulating(false);
    }
  };

  // ── Copy QR string ───────────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!payment) return;
    await navigator.clipboard.writeText(payment.qr_string);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft === 0 && payment !== null;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={styles.page}>

        {/* Header */}
        <header style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn} className="q-btn-press">
            <ArrowLeft size={18} />
          </button>
          <h1 style={styles.headerTitle}>Pembayaran QRIS</h1>
          <div style={{ width: 36 }} />
        </header>

        <main style={styles.main}>

          {/* Amount pill */}
          <div style={styles.amountPill}>
            <span style={styles.amountLabel}>Total Pembayaran</span>
            <span style={styles.amountValue}>{fmt(total)}</span>
          </div>

          {/* QR Card */}
          <div style={styles.qrCard}>
            {loading && (
              <div style={styles.qrPlaceholder}>
                <div style={styles.spinner} />
                <p style={styles.loadingText}>Membuat kode QRIS...</p>
              </div>
            )}

            {error && (
              <div style={styles.errorBox}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>⚠️</p>
                <p style={styles.errorText}>{error}</p>
                <button onClick={() => router.back()} style={styles.retryBtn}>Coba Lagi</button>
              </div>
            )}

            {payment && !error && (
              <>
                {/* QR Code Image */}
                <div style={styles.qrImageWrap}>
                  {isExpired ? (
                    <div style={styles.expiredOverlay}>
                      <p style={{ fontSize: 28 }}>⏱️</p>
                      <p style={styles.expiredText}>QR Kedaluwarsa</p>
                      <button onClick={() => window.location.reload()} style={styles.refreshBtn}>Refresh</button>
                    </div>
                  ) : (
                    <Image
                      src={payment.qr_image_url}
                      alt="QRIS Payment Code"
                      width={220}
                      height={220}
                      style={{ borderRadius: 12, opacity: isExpired ? 0.3 : 1 }}
                      unoptimized
                    />
                  )}
                </div>

                {/* QRIS Logo Row */}
                <div style={styles.qrisLabel}>
                  <span style={styles.qrisText}>QRIS</span>
                  <span style={styles.qrisSubtext}>Scan dengan aplikasi apapun</span>
                </div>

                {/* Timer */}
                {!isExpired && (
                  <div style={styles.timerWrap}>
                    <span style={styles.timerLabel}>Berlaku dalam</span>
                    <span style={secondsLeft < 60 ? styles.timerValueUrgent : styles.timerValue}>
                      {pad(minutes)}:{pad(seconds)}
                    </span>
                  </div>
                )}

                {/* Copy QR String */}
                <button onClick={handleCopy} style={styles.copyBtn}>
                  {copied ? "✓ Disalin!" : "Salin Kode QR"}
                </button>
              </>
            )}
          </div>

          {/* ── Simulation Button (dev/testing) ────────────────────────────── */}
          {payment && !isExpired && !error && (
            <div style={styles.simCard}>
              <div style={styles.simBadgeRow}>
                <span style={styles.simBadge}>🧪 Mode Simulasi</span>
                <span style={styles.simBadgeLabel}>Hanya untuk testing</span>
              </div>
              <p style={styles.simDesc}>
                Klik tombol di bawah untuk mensimulasikan pembayaran QRIS berhasil tanpa scan QR.
              </p>
              <button
                id="btn-simulate-payment"
                onClick={handleSimulate}
                disabled={simulating || simSuccess}
                style={
                  simSuccess
                    ? styles.simBtnSuccess
                    : simulating
                    ? styles.simBtnLoading
                    : styles.simBtn
                }
              >
                {simSuccess ? (
                  <>✓ Pembayaran Disimulasikan</>
                ) : simulating ? (
                  <>
                    <span style={styles.simSpinner} />
                    Memproses simulasi...
                  </>
                ) : (
                  <>⚡ Simulasi Bayar Sekarang</>
                )}
              </button>
              {simSuccess && (
                <p style={styles.simSuccessNote}>
                  Menunggu konfirmasi status dari server...
                </p>
              )}
            </div>
          )}

          {/* Steps */}
          <div style={styles.stepsCard}>
            <p style={styles.sectionLabel}>Cara Bayar</p>
            {[
              "Buka aplikasi dompet digital atau m-banking",
              "Pilih fitur Scan QR / QRIS",
              "Arahkan kamera ke kode di atas",
              "Konfirmasi jumlah dan selesaikan pembayaran",
            ].map((step, i) => (
              <div key={i} style={styles.stepRow}>
                <div style={styles.stepNum}>{i + 1}</div>
                <p style={styles.stepText}>{step}</p>
              </div>
            ))}
          </div>

          {/* Polling indicator */}
          {payment && !isExpired && !error && (
            <div style={styles.pollingBanner}>
              <div style={styles.pollingDot} />
              <p style={styles.pollingText}>Menunggu konfirmasi pembayaran...</p>
            </div>
          )}

          <div style={{ height: 40 }} />
        </main>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M12 4L6 10l6 6" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GLOBAL_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F7F5F0; font-family: var(--font-dm-sans); -webkit-font-smoothing: antialiased; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes simSpin { to { transform: rotate(360deg); } }

  #btn-simulate-payment:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); transition: all 0.15s ease; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--q-bg)", fontFamily: "var(--font-dm-sans)" },

  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(max(20px, env(safe-area-inset-top)) + 36px) 20px 16px", background: "var(--q-bg)",
    position: "sticky", top: 0, zIndex: 20,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid var(--q-border)",
  },
  backBtn: { width: 42, height: 42, borderRadius: 14, border: "1.5px solid var(--q-border)", background: "var(--q-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--q-text-primary)", cursor: "pointer", boxShadow: "var(--q-shadow-sm)" },
  headerTitle: { fontFamily: "var(--font-dm-serif)", fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--q-text-primary)" },

  main: { padding: "20px" },

  amountPill: {
    background: "var(--q-text-primary)", borderRadius: 18, padding: "16px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
  },
  amountLabel: { fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-dm-sans)" },
  amountValue: { fontFamily: "var(--font-dm-serif)", fontSize: 22, fontWeight: 400, color: "#fff" },

  qrCard: {
    background: "var(--q-surface)", borderRadius: 20, border: "1px solid var(--q-border)",
    padding: "28px 20px", marginBottom: 16,
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16,
    minHeight: 300, boxShadow: "var(--q-shadow-card)",
  },

  qrPlaceholder: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16, padding: "40px 0" },
  qrPlaceholderBox: { width: 220, height: 220, background: "#f5f3ee", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },

  errorBox: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 10, padding: "20px 0" },
  errorText: { fontSize: 14, color: "#E24B4A", textAlign: "center" as const },
  retryBtn: { background: "var(--q-text-primary)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-dm-sans)" },

  qrImageWrap: { position: "relative" as const, display: "flex", alignItems: "center", justifyContent: "center" },
  expiredOverlay: { width: 220, height: 220, borderRadius: 12, background: "#F5F3EE", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 8 },
  expiredText: { fontSize: 14, fontWeight: 600, color: "#E24B4A" },
  refreshBtn: { background: "var(--q-text-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 12, cursor: "pointer", marginTop: 4, fontFamily: "var(--font-dm-sans)" },

  qrisLabel: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2 },
  qrisText: { fontFamily: "var(--font-dm-sans)", fontSize: 18, fontWeight: 700, color: "#1A1A18", letterSpacing: 2 },

  timerRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  timerLabel: { fontSize: 12, color: "#888" },
  timerValue: { fontFamily: "var(--font-dm-sans)", fontSize: 18, fontWeight: 700, color: "#1A1A18" },
  timerValueUrgent: { fontFamily: "var(--font-dm-sans)", fontSize: 18, fontWeight: 700, color: "#E24B4A" },

  copyBtn: {
    width: "100%", background: "var(--q-bg-subtle)", color: "var(--q-text-primary)",
    border: "1px solid var(--q-border)", borderRadius: 14, padding: "12px 20px",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "var(--font-dm-sans)", transition: "background 0.15s",
  },

  // ── Simulation card ──────────────────────────────────────────────────────────
  simCard: {
    background: "#FFFBF0",
    border: "1.5px dashed #F0C853",
    borderRadius: 20,
    padding: "18px",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    boxShadow: "var(--q-shadow-sm)",
  },
  simBadgeRow: { display: "flex", alignItems: "center", gap: 8 },
  simBadge: { background: "#F0C853", color: "#7A5C00", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-dm-sans)" },
  simTitle: { fontSize: 14, fontWeight: 700, color: "#7A5C00" },
  simDesc: { fontSize: 12.5, color: "#856404", lineHeight: 1.5 },
  simBtn: {
    background: "#F0C853", color: "#7A5C00", border: "none",
    borderRadius: 12, padding: "12px 20px", fontSize: 13,
    fontWeight: 700, cursor: "pointer",
    fontFamily: "var(--font-dm-sans)", transition: "background 0.15s",
  },
  simBtnDisabled: {
    background: "#F9EBBC", color: "#B5A165", border: "none",
    borderRadius: 12, padding: "12px 20px", fontSize: 13,
    fontWeight: 700, cursor: "not-allowed",
    fontFamily: "var(--font-dm-sans)",
  },
  simBtnSuccess: {
    width: "100%",
    background: "#D1F5E4",
    color: "#1A7A47",
    border: "none",
    borderRadius: 12,
    padding: "14px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "default",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  simSpinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid #ccc",
    borderTop: "2px solid #888",
    borderRadius: "50%",
    animation: "simSpin 0.8s linear infinite",
    flexShrink: 0,
  },
  simSuccessNote: { fontSize: 12, color: "#1A7A47", textAlign: "center" as const },

  stepsCard: { background: "var(--q-surface)", borderRadius: 20, border: "1px solid var(--q-border)", padding: "16px 18px", marginBottom: 14, boxShadow: "var(--q-shadow-card)" },
  sectionLabel: { fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#b0aa9f", textTransform: "uppercase" as const, marginBottom: 12 },
  stepRow: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: "50%", background: "#1A1A18", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepText: { fontSize: 13, color: "#555", lineHeight: 1.5 },

  pollingBanner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#E8F8EE", borderRadius: 14, border: "1px solid #c3ecd5" },
  pollingDot: { width: 8, height: 8, borderRadius: "50%", background: "#639922", animation: "pulse 1.5s ease-in-out infinite" },
  pollingText: { fontSize: 13, color: "#3B6D11", fontWeight: 500 },
};
