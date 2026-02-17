-- Performance Indexes for High Traffic (5K-10K users)
-- Run these in PostgreSQL to optimize database performance

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = false;

-- Colleges table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_colleges_created_at ON colleges(created_at);

-- Shops table indexes for location queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_location ON shops USING GIST (
  point(longitude, latitude)
);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_is_approved ON shops(is_approved) WHERE is_approved = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_created_at ON shops(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_name_trgm ON shops USING gin (name gin_trgm_ops);

-- Products table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Orders table indexes for high traffic
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);

-- College deliveries indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_college_deliveries_college_id ON college_deliveries(college_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_college_deliveries_shop_owner_id ON college_deliveries(shop_owner_id);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Reports indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_type ON reports(type);

-- Support contacts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_contacts_created_at ON support_contacts(created_at);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_shop_category ON products(shop_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shops_approved_location ON shops(is_approved, longitude, latitude) WHERE is_approved = true;

-- Enable pg_trgm for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze tables for query planner
ANALYZE users;
ANALYZE colleges;
ANALYZE shops;
ANALYZE products;
ANALYZE orders;
ANALYZE college_deliveries;
ANALYZE notifications;
ANALYZE messages;
ANALYZE reports;
ANALYZE support_contacts;
