#!/bin/bash

# 🚀 Campus Store Supabase Deployment Script

echo "🔧 Setting up Supabase deployment..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your Supabase credentials"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client for PostgreSQL
echo "🗄️ Generating Prisma client..."
npm run db:generate

# Push schema to Supabase
echo "🗄️ Pushing schema to Supabase..."
npm run db:push

# Build the application
echo "🏗️ Building application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your Campus Store is now live!"
echo ""
echo "📋 Next steps:"
echo "1. Update NEXTAUTH_URL in Vercel dashboard"
echo "2. Configure custom domain if needed"
echo "3. Set up monitoring and analytics"
echo ""
echo "🔗 Supabase Dashboard: https://app.supabase.com"
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
