// ============================================================
// Database Types
// ============================================================

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  is_featured?: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string | null
  status: OrderStatus
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  item_name: string
  item_price: number
  quantity: number
  subtotal: number
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export interface MerchantSettings {
  id: string
  store_name: string
  pin_hash: string
  is_open: boolean
  created_at: string
}

// ============================================================
// Enums & Constants
// ============================================================

export type OrderStatus = 
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
  "COMPLETED",
]

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: string
  bgColor: string
  icon: string
  description: string
}> = {
  PENDING: {
    label: "Menunggu",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: "clock",
    description: "Pesanan sedang menunggu konfirmasi",
  },
  PREPARING: {
    label: "Diproses",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: "chef-hat",
    description: "Pesanan sedang diproses",
  },
  READY: {
    label: "Siap",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    icon: "check-circle",
    description: "Pesanan siap diambil!",
  },
  COMPLETED: {
    label: "Selesai",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10 border-gray-500/20",
    icon: "package-check",
    description: "Pesanan telah diselesaikan",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: "x-circle",
    description: "Pesanan dibatalkan",
  },
}

// ============================================================
// Cart Types
// ============================================================

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface CheckoutData {
  customer_email: string
  customer_name: string
  notes: string
  items: {
    menu_item_id: string
    item_name: string
    item_price: number
    quantity: number
  }[]
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
