# 🚀 How to Run Campus Marketplace Locally

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

## Step 3: Start Development Server
```bash
npm run dev
```

## Step 4: Open Browser
Navigate to: **http://localhost:3000**

---

## 📱 Testing Your App

### Quick Test Flow:
1. **Register as Student** → Browse shops → Add to cart → Checkout
2. **Register as Shop Owner** → Add products → Manage orders
3. **Admin Access** → Use admin credentials to view dashboard

### Default Admin Setup:
- Create an account with `isAdmin: true` in database
- Or modify existing user to be admin

### Key Features to Test:
- ✅ Student registration and shop browsing
- ✅ Shop owner registration and product management  
- ✅ Order flow (cart → payment → delivery)
- ✅ Chat & Call buttons (appear after order acceptance)
- ✅ Admin dashboard with real-time stats
- ✅ Neon theme UI consistency

---

## 🔧 Common Issues

### Database Issues:
```bash
# Reset database if needed
rm -f prisma/dev.db
npm run db:push
```

### Port Already in Use:
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
npm run dev -- -p 3001
```

### Permission Issues (Windows):
If you get script execution errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📁 Project Structure
```
src/
├── app/                 # Next.js pages
│   ├── api/            # API routes
│   ├── admin/          # Admin dashboard
│   ├── student/        # Student pages
│   └── shop/           # Shop owner pages
├── components/         # Reusable components
├── lib/               # Utilities (auth, db)
└── app/               # Root layout & pages
```

## 🎯 Next Steps
1. Test all user roles
2. Verify chat functionality works
3. Check admin stats display correctly
4. Test payment flow with QR codes

Happy vibe coding! 🚀
