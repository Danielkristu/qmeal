-- ============================================================
-- Food Order App — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Menu Items
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0, -- Price in IDR
  category TEXT NOT NULL DEFAULT 'Makanan',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PREPARING','READY','COMPLETED','CANCELLED')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Order Items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  item_price INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- Merchant Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'My Food Store',
  pin_hash TEXT NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- ============================================================
-- Function to generate order numbers
-- ============================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_count INTEGER;
  order_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM orders
  WHERE created_at::date = CURRENT_DATE;
  
  order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(today_count::text, 3, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Enable Realtime on orders table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- RLS Policies (allow all for anon since no auth required for customer)
-- ============================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_settings ENABLE ROW LEVEL SECURITY;

-- Menu items: anyone can read available items
CREATE POLICY "Anyone can read available menu items"
  ON menu_items FOR SELECT USING (true);

-- Menu items: service role can do everything (API routes use service role)
CREATE POLICY "Service role can manage menu items"
  ON menu_items FOR ALL USING (auth.role() = 'service_role');

-- Orders: anyone can read (for tracking)
CREATE POLICY "Anyone can read orders"
  ON orders FOR SELECT USING (true);

-- Orders: service role can do everything
CREATE POLICY "Service role can manage orders"
  ON orders FOR ALL USING (auth.role() = 'service_role');

-- Order items: anyone can read
CREATE POLICY "Anyone can read order items"
  ON order_items FOR SELECT USING (true);

-- Order items: service role can do everything
CREATE POLICY "Service role can manage order items"
  ON order_items FOR ALL USING (auth.role() = 'service_role');

-- Merchant settings: service role only
CREATE POLICY "Service role can manage merchant settings"
  ON merchant_settings FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Seed Data: Sample Menu Items
-- ============================================================
INSERT INTO menu_items (name, description, price, category, is_available, sort_order) VALUES
  ('Nasi Goreng Spesial', 'Nasi goreng dengan telur, ayam, dan sayuran segar', 25000, 'Makanan', true, 1),
  ('Mie Goreng', 'Mie goreng dengan bumbu rahasia dan topping lengkap', 22000, 'Makanan', true, 2),
  ('Ayam Geprek', 'Ayam goreng crispy dengan sambal geprek level pilihan', 28000, 'Makanan', true, 3),
  ('Nasi Ayam Bakar', 'Nasi putih dengan ayam bakar madu dan lalapan', 30000, 'Makanan', true, 4),
  ('Soto Ayam', 'Soto ayam dengan kuah bening dan pelengkap', 20000, 'Makanan', true, 5),
  ('Es Teh Manis', 'Teh manis dingin segar', 5000, 'Minuman', true, 6),
  ('Es Jeruk', 'Jeruk peras segar dengan es', 8000, 'Minuman', true, 7),
  ('Kopi Susu', 'Kopi susu gula aren khas', 15000, 'Minuman', true, 8),
  ('Jus Alpukat', 'Jus alpukat segar dengan susu coklat', 18000, 'Minuman', true, 9),
  ('Air Mineral', 'Air mineral botol 600ml', 4000, 'Minuman', true, 10),
  ('Kentang Goreng', 'Kentang goreng crispy dengan saus sambal', 15000, 'Snack', true, 11),
  ('Pisang Goreng', 'Pisang goreng crispy dengan topping keju/coklat', 12000, 'Snack', true, 12),
  ('Tahu Crispy', 'Tahu goreng crispy dengan bumbu pedas', 10000, 'Snack', true, 13),
  ('Dimsum Ayam', 'Dimsum ayam kukus isi 5 pcs', 18000, 'Snack', true, 14)
ON CONFLICT DO NOTHING;
