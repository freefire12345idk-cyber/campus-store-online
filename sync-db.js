// Database sync script for Windows PowerShell
const { execSync } = require('child_process');

console.log('🔄 Starting database synchronization...');

try {
  // Show current DATABASE_URL (masked for security)
  const dbUrl = process.env.DATABASE_URL;
  console.log('📊 DATABASE_URL:', dbUrl ? dbUrl.substring(0, 20) + '...' : 'NOT SET');
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
  
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to database
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database synchronization completed!');
} catch (error) {
  console.error('❌ Database sync failed:', error.message);
  process.exit(1);
}
