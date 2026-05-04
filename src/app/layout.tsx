import type { Metadata } from "next"
import { Geist, Geist_Mono, DM_Serif_Display, DM_Sans } from "next/font/google"
import { Toaster } from "sonner"
import { CartProvider } from "@/context/cart-context"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "FoodSnap — Pesan Makanan Online",
  description:
    "Pesan makanan favoritmu secara online. Cepat, mudah, dan tanpa perlu login.",
  keywords: ["food order", "pesan makanan", "online food", "delivery"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSerif.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: "12px",
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  )
}
