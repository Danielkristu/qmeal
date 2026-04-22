# Food Order App

A modern, realtime food ordering platform built with Next.js 15, TailwindCSS v4, and Supabase.

## Features

- **Customer View**: Browse menu, add to cart, checkout with email (no login required)
- **Live Order Tracking**: Customers can track their order status in realtime without refreshing
- **Merchant Dashboard**: PIN-protected backend to manage incoming orders (Kanban board)
- **Realtime Updates**: Uses Supabase Realtime (WebSockets) for instant order syncing
- **Hardware Integration**: Includes an Arduino ESP32 sketch for a physical button to update order statuses

## Stack
- Next.js 15 (App Router)
- React 19
- Supabase (Postgres Database + Realtime)
- TailwindCSS v4
- shadcn/ui components

## Setup Instructions

1. **Database Setup**
   - Create a new project in your Supabase dashboard
   - Run the SQL script found in `supabase-schema.sql` in the Supabase SQL Editor
   - Get your Project URL, Anon Key, and Service Role Key

2. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase credentials
   - Set a PIN for the merchant dashboard
   - Set an API key for the Arduino webhook

3. **Running the App**
   ```bash
   npm install
   npm run dev
   ```

4. **Accessing the App**
   - Customer Portal: `http://localhost:3000`
   - Merchant Dashboard: `http://localhost:3000/merchant`
# qmeal
