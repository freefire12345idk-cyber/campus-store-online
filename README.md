# Campus Store

A website for nearby stores to list their shop and receive orders from college students. Only students from selected colleges can order; shops deliver to 4–5 colleges. **Admin** approves shops before they are visible to students. Students pay in advance via the shop’s scanner/QR and upload a payment screenshot; shop owners see **student phone and email** on orders.

## Features

### Students
- **Register** with **email (optional)** and **phone**, choose one college, hostel/branch, roll no. Or **Sign in with Google** → complete profile (phone + college).
- **Login** with email or phone + password. (If you use email OTP, check your **Email and Spam folder** for the code.)
- See only **approved** shops within **1 km** of their college. Shops show **shop photo** and **product photos**.
- **Cart**: One shop at a time. **Checkout**: delivery college, payment screenshot. **Orders**: OTP and notifications.

### Shop owners
- **Register** with **shop photo** (required), shop name, **location via Google Maps** (lat/lng + link), colleges they deliver to. After registration, **admin must approve** the shop; only then is it visible to students.
- **Login**; manage **products** (with **product photos**), **orders** (see **student phone and email**), **Settings** (colleges, payment QR).

### Admin
- **Login** as admin (e.g. `admin@campus.local` / `admin123` after seed). Open **Admin Dashboard** (`/admin/dashboard`).
- See all registered shops: **Shop name**, **owner name**, **phone**, **email**, **shop photo**, **Google Maps** link.
- **Approve** or **Reject** each shop. Rejected/unapproved shops are **not visible to students**.

### Notifications
- Shop: new order (with payment proof). Student: order accepted/declined, out for delivery, delivered.

## Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Prisma** + **SQLite**, **NextAuth** (Google Sign-in)
- Session-based auth (cookie), file upload for payment/shop/product screenshots

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment** (`.env` in project root):
   ```env
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET="your-secret-change-in-production"
   NEXTAUTH_SECRET="your-nextauth-secret-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   # Optional – for Google Sign-in (create at https://console.cloud.google.com/apis/credentials):
   # GOOGLE_CLIENT_ID=...
   # GOOGLE_CLIENT_SECRET=...
   ```

3. **Database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
   Seeds 5 colleges and an **admin user**: `admin@campus.local` / `admin123`. Use this to open `/admin/dashboard` and approve shops.

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Usage

- **Home**: Register (Student/Shop) or Login. **Google Sign-in** → complete profile (phone + role + college if student).
- **Admin**: Login with admin account → **Admin** link or go to `/admin/dashboard` → approve/reject shops.
- **Student**: Shops (only approved, within 1 km) → cart → checkout (payment screenshot) → orders.
- **Shop**: Dashboard, Products (with photos), Orders (student phone/email), Settings (colleges, payment QR).

## Notes

- **Order “Failed to process”**: Usually due to invalid cart data (e.g. quantity/price). Cart quantities are now coerced to numbers. Ensure you upload a **payment screenshot** before placing order.
- **1 km rule**: Only **approved** shops within 1 km of the student’s college are shown.
- **OTP**: Shown to student when order is out for delivery/delivered; student gives it when receiving the order.
