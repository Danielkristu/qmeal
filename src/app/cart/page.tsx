"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Makanan: "🍜",
    Minuman: "🥤",
    Snack: "🍟",
  };
  return map[category] || "🍽️";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter();
  const { 
    items: cart, 
    addItem, 
    updateQuantity, 
    clearCart, 
    totalAmount: subtotal 
  } = useCart();

  const [notes, setNotes] = useState("");

  const serviceFee = 1000;
  const total = subtotal + serviceFee;

  const handleCheckout = async () => {
    // Store cart and notes in sessionStorage before navigating to checkout
    // We store a simplified version for the checkout page if needed, 
    // or just the total/notes.
    sessionStorage.setItem("qmeal_cart", JSON.stringify(cart));
    sessionStorage.setItem("qmeal_total", String(total));
    sessionStorage.setItem("qmeal_notes", notes);
    router.push("/checkout");
  };

  if (cart.length === 0) {
    return (
      <>
        <style>{GLOBAL_STYLE}</style>
        <div style={styles.page}>
          <header style={styles.header}>
            <button onClick={() => router.back()} style={styles.backBtn}>
              <BackIcon />
            </button>
            <h1 style={styles.headerTitle}>Pesanan Saya</h1>
            <div style={{ width: 36 }} />
          </header>
          <div style={styles.emptyState}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🛒</p>
            <p style={styles.emptyTitle}>Keranjang kosong</p>
            <p style={styles.emptyDesc}>Tambahkan menu untuk mulai pesan</p>
            <button onClick={() => router.back()} style={styles.browseBtn}>
              Lihat Menu
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={styles.page}>

        {/* Header */}
        <header style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn}>
            <BackIcon />
          </button>
          <h1 style={styles.headerTitle}>Pesanan Saya</h1>
          <button onClick={clearCart} style={styles.clearBtn}>Hapus</button>
        </header>

        <main style={styles.main}>

          {/* Cart Items */}
          <section style={styles.section}>
            {cart.map((item) => (
              <div key={item.menuItem.id} style={styles.cartRow}>
                <div style={styles.itemEmoji}>{getCategoryEmoji(item.menuItem.category)}</div>
                <div style={styles.itemInfo}>
                  <p style={styles.itemName}>{item.menuItem.name}</p>
                  <p style={styles.itemPrice}>{fmt(item.menuItem.price)}</p>
                </div>
                <div style={styles.qtyControl}>
                  <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} style={styles.qtyBtn}>−</button>
                  <span style={styles.qtyNum}>{item.quantity}</span>
                  <button onClick={() => addItem(item.menuItem)} style={styles.qtyBtnAdd}>+</button>
                </div>
              </div>
            ))}
          </section>

          {/* Notes */}
          <section style={styles.section}>
            <p style={styles.sectionLabel}>Catatan (opsional)</p>
            <textarea
              placeholder="Contoh: jangan pedas, kurangi gula..."
              style={styles.notes}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {/* Summary */}
          <section style={styles.summaryCard}>
            <p style={styles.sectionLabel}>Ringkasan</p>
            <div style={styles.summaryRow}>
              <span style={styles.summaryKey}>Subtotal</span>
              <span style={styles.summaryVal}>{fmt(subtotal)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryKey}>Biaya layanan</span>
              <span style={styles.summaryVal}>{fmt(serviceFee)}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={styles.totalKey}>Total</span>
              <span style={styles.totalVal}>{fmt(total)}</span>
            </div>
          </section>

          <div style={{ height: 100 }} />
        </main>

        {/* Checkout Button */}
        <div style={styles.ctaWrap}>
          <button onClick={handleCheckout} style={styles.ctaBtn}>
            <span>Bayar Sekarang</span>
            <span style={styles.ctaPrice}>{fmt(total)}</span>
          </button>
        </div>
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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F7F5F0; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  textarea:focus, input:focus { outline: none; border-color: #C8702A !important; box-shadow: 0 0 0 3px rgba(200,112,42,0.1); }
  button { cursor: pointer; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "#F7F5F0", position: "relative" },

  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", background: "#F7F5F0",
    position: "sticky", top: 0, zIndex: 20,
    borderBottom: "1px solid #EDEBE4",
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E8E4DB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A1A18" },
  headerTitle: { fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "#1A1A18" },
  clearBtn: { fontSize: 13, color: "#E24B4A", background: "none", border: "none", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" },

  main: { padding: "20px 20px 0" },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#b0aa9f", textTransform: "uppercase" as const, marginBottom: 10 },

  cartRow: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#fff", borderRadius: 14, border: "1px solid #EDEBE4",
    padding: "12px 14px", marginBottom: 8,
  },
  itemEmoji: { fontSize: 26, width: 40, height: 40, background: "#F5F3EE", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 600, color: "#1A1A18", marginBottom: 2, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  itemPrice: { fontSize: 12, color: "#888" },

  qtyControl: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  qtyBtn: { width: 26, height: 26, borderRadius: 7, background: "#1A1A18", color: "#fff", border: "none", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  qtyBtnAdd: { width: 26, height: 26, borderRadius: 7, background: "#F0EDE6", color: "#1A1A18", border: "none", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 13, fontWeight: 500, minWidth: 16, textAlign: "center" as const, color: "#1A1A18" },

  notes: { width: "100%", borderRadius: 12, border: "1.5px solid #E8E4DB", background: "#fff", padding: "12px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#1A1A18", resize: "none" as const },

  summaryCard: { background: "#fff", borderRadius: 16, border: "1px solid #EDEBE4", padding: "16px 18px", marginBottom: 16 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryKey: { fontSize: 13, color: "#888" },
  summaryVal: { fontSize: 13, color: "#1A1A18", fontWeight: 500 },
  divider: { height: 1, background: "#EDEBE4", margin: "10px 0" },
  totalKey: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#1A1A18" },
  totalVal: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#C8702A" },

  ctaWrap: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 390, zIndex: 30 },
  ctaBtn: { width: "100%", background: "#1A1A18", color: "#fff", border: "none", borderRadius: 16, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, cursor: "pointer" },
  ctaPrice: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15 },

  emptyState: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: "70vh", textAlign: "center" as const, padding: "0 40px" },
  emptyTitle: { fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#1A1A18", marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: "#aaa", marginBottom: 24 },
  browseBtn: { background: "#1A1A18", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
};
