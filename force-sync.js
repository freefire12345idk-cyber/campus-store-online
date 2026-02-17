const { execSync } = require('child_process');

console.log('🔄 Starting database synchronization...');

try {
  // Set DATABASE_URL directly for this sync - proper URL encoding
  const dbUrl = 'postgresql://postgres:sqxttqxuviexmsgqtohz.supabase.co%3A5432%2Fpostgres';
  process.env.DATABASE_URL = dbUrl;
  console.log('📊 DATABASE_URL:', dbUrl.substring(0, 20) + '...');
  
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to database
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('✅ Database synchronization completed!');
} catch (error) {
  console.error('❌ Database sync failed:', error.message);
  process.exit(1);
}
