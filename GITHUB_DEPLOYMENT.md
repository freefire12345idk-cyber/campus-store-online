# 🚀 GitHub + Vercel Deployment Guide

## **Step 1: Initialize Git Repository**

```bash
# Open terminal in your project folder
cd "C:\Users\iNdia\Desktop\new project"

# Initialize git
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Campus Store application"
```

## **Step 2: Create GitHub Repository**

1. **Go to GitHub**: https://github.com
2. **Click "New repository"**
3. **Repository name**: `campus-store`
4. **Description**: `Campus Marketplace for students and shops`
5. **Make it Public** (free hosting requires public repo)
6. **Don't initialize with README** (we already have files)
7. **Click "Create repository"**

## **Step 3: Push to GitHub**

```bash
# Add remote origin (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/campus-store.git

# Push to main branch
git push -u origin main
```

## **Step 4: Deploy to Vercel**

### **Method 1: Quick Deploy (Recommended)**

1. **Go to Vercel**: https://vercel.com
2. **Sign up/login with GitHub**
3. **Click "New Project"**
4. **Import Git Repository**: Select `campus-store`
5. **Framework**: Next.js (auto-detected)
6. **Root Directory**: `./` (default)
7. **Build Command**: `npm run build` (auto-detected)
8. **Output Directory**: `.next` (auto-detected)
9. **Click "Deploy"**

### **Method 2: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## **Step 5: Configure Environment Variables**

### **In Vercel Dashboard:**

1. **Go to Project Settings** → **Environment Variables**
2. **Add these variables**:

```env
# Database
DATABASE_URL="https://sqxttqxuviexmsgqtohz.supabase.co"

# NextAuth
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-16-character-app-password"

# Development
NODE_ENV="production"
```

## **Step 6: Update Domain (Optional)**

1. **In Vercel Dashboard**: Go to **Domains**
2. **Add custom domain**: `your-domain.com`
3. **Update DNS** as instructed by Vercel
4. **Update NEXTAUTH_URL** to your custom domain

## **Step 7: Test Deployment**

1. **Visit your app**: `https://your-app-name.vercel.app`
2. **Test registration**: Create student/shop owner accounts
3. **Test OTP**: Verify email sending works
4. **Test features**: Orders, chat, notifications

## **🔧 Troubleshooting**

### **Build Errors:**
- Check `package.json` scripts
- Verify environment variables
- Check for missing dependencies

### **Database Connection:**
- Verify Supabase URL is correct
- Check network connectivity
- Ensure Prisma schema matches

### **Email Not Working:**
- Verify Gmail App Password
- Check environment variables
- Review Vercel logs

### **Deployment Fails:**
- Check GitHub repository is public
- Verify build logs in Vercel
- Ensure all files are committed

## **📱 Mobile Testing**

```bash
# Test on mobile
# Open your app on phone browser
# Test responsive design
# Verify touch interactions
```

## **🔄 Automatic Deployments**

Once connected, Vercel will **auto-deploy** when you:
1. Push to GitHub main branch
2. Create pull requests
3. Merge changes

## **📊 Monitoring**

### **Vercel Analytics:**
1. Go to Vercel Dashboard
2. Click **Analytics**
3. Monitor performance and usage

### **Supabase Dashboard:**
1. Go to Supabase Console
2. Monitor database usage
3. Check API calls

## **🚀 Quick Commands**

```bash
# After making changes:
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will auto-deploy!
```

## **✅ Success Checklist**

- [ ] GitHub repository created and pushed
- [ ] Vercel project connected
- [ ] Environment variables configured
- [ ] Database connected to Supabase
- [ ] Email OTP working
- [ ] All features tested
- [ ] Custom domain set (optional)

**Your Campus Store is now live! 🎉**
