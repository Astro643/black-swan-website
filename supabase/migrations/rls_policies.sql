-- ============================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- For Black Swan Stock Market Game
-- ============================================

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- User Profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Stocks
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Portfolios
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Shop Items
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Inventories
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;

-- Market Events
ALTER TABLE market_events ENABLE ROW LEVEL SECURITY;

-- Loans
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Manipulation Queue
ALTER TABLE manipulation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = discord_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = discord_id)
WITH CHECK (auth.uid() = discord_id);

-- Allow admin (service role) to read all profiles
CREATE POLICY "Admin can view all profiles"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- STOCKS POLICIES
-- ============================================

-- Anyone can read stocks (public data)
CREATE POLICY "Anyone can view stocks"
ON stocks
FOR SELECT
USING (true);

-- Only admin can update stocks
CREATE POLICY "Only admin can update stocks"
ON stocks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- PORTFOLIOS POLICIES
-- ============================================

-- Users can only view their own portfolio
CREATE POLICY "Users can view their own portfolio"
ON portfolios
FOR SELECT
USING (user_id = auth.uid());

-- Users can only update their own portfolio
CREATE POLICY "Users can update their own portfolio"
ON portfolios
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all portfolios
CREATE POLICY "Admin can view all portfolios"
ON portfolios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Users can only view their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions
FOR SELECT
USING (user_id = auth.uid());

-- Users can only create their own transactions
CREATE POLICY "Users can create their own transactions"
ON transactions
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own transactions
CREATE POLICY "Users can update their own transactions"
ON transactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
ON transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- SHOP ITEMS POLICIES
-- ============================================

-- Anyone can view shop items (public catalog)
CREATE POLICY "Anyone can view shop items"
ON shop_items
FOR SELECT
USING (true);

-- Only admin can manage shop items
CREATE POLICY "Only admin can manage shop items"
ON shop_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- INVENTORIES POLICIES
-- ============================================

-- Users can only view their own inventory
CREATE POLICY "Users can view their own inventory"
ON inventories
FOR SELECT
USING (user_id = auth.uid());

-- Users can only manage their own inventory
CREATE POLICY "Users can manage their own inventory"
ON inventories
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all inventories
CREATE POLICY "Admin can view all inventories"
ON inventories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- MARKET EVENTS POLICIES
-- ============================================

-- Anyone can view market events (public data)
CREATE POLICY "Anyone can view market events"
ON market_events
FOR SELECT
USING (true);

-- Only admin can create market events
CREATE POLICY "Only admin can create market events"
ON market_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- LOANS POLICIES
-- ============================================

-- Users can only view their own loans
CREATE POLICY "Users can view their own loans"
ON loans
FOR SELECT
USING (user_id = auth.uid());

-- Users can only manage their own loans
CREATE POLICY "Users can manage their own loans"
ON loans
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all loans
CREATE POLICY "Admin can view all loans"
ON loans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can only manage their own notifications
CREATE POLICY "Users can manage their own notifications"
ON notifications
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all notifications
CREATE POLICY "Admin can view all notifications"
ON notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- MANIPULATION QUEUE POLICIES
-- ============================================

-- Users can only view their own manipulations
CREATE POLICY "Users can view their own manipulations"
ON manipulation_queue
FOR SELECT
USING (user_id = auth.uid());

-- Users can only create their own manipulations
CREATE POLICY "Users can create their own manipulations"
ON manipulation_queue
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admin can view all manipulations
CREATE POLICY "Admin can view all manipulations"
ON manipulation_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- ADMINS TABLE (for tracking admin users)
-- ============================================

-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow admin to manage admins
CREATE POLICY "Admin can manage admins"
ON admins
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- REALTIME POLICIES
-- ============================================

-- Enable realtime for stocks
ALTER PUBLICATION supabase_realtime ADD TABLE stocks;

-- Enable realtime for user_profiles
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Enable realtime for portfolios
ALTER PUBLICATION supabase_realtime ADD TABLE portfolios;

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Enable realtime for market_events
ALTER PUBLICATION supabase_realtime ADD TABLE market_events;

-- ============================================
-- COMMENTS
-- ============================================

-- Note: These policies assume:
-- 1. Users are authenticated via Discord OAuth (auth.uid() returns Discord ID)
-- 2. The discord_id field in user_profiles matches auth.uid()
-- 3. An admins table exists to track admin users
-- 4. The bot uses the service role key (bypasses RLS)
--
-- For the Discord bot to work with RLS enabled:
-- - Use the SUPABASE_SERVICE_ROLE_KEY for bot operations
-- - Or create a dedicated bot user with appropriate permissions
--
-- For testing, you may need to temporarily disable RLS:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
