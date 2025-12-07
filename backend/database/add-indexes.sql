-- Performance Optimization: Add indexes for faster queries
-- MySQL doesn't support IF NOT EXISTS for indexes, so the script handles this

-- Notifications table indexes
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Users table indexes  
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Transactions table indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- KYC verifications indexes
CREATE INDEX idx_kyc_user ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
CREATE INDEX idx_kyc_created ON kyc_verifications(created_at DESC);
CREATE INDEX idx_kyc_status_created ON kyc_verifications(status, created_at DESC);

-- Wallets table indexes
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallets_currency ON wallets(currency_code);
CREATE INDEX idx_wallets_status ON wallets(status);

-- FX rates table indexes
CREATE INDEX idx_fx_rates_base_quote ON fx_rates(base_currency, quote_currency);
CREATE INDEX idx_fx_rates_fetched ON fx_rates(fetched_at DESC);
CREATE INDEX idx_fx_rates_base_fetched ON fx_rates(base_currency, fetched_at DESC);

