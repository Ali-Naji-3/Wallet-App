-- Remove foreign key constraints for better performance
-- Keep only notifications table with REFERENCES

-- Remove foreign key from transactions table
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS fk_tx_user;

-- Remove foreign key from wallets table  
ALTER TABLE wallets DROP FOREIGN KEY IF EXISTS fk_wallets_user;

-- Remove foreign keys from kyc_verifications table
ALTER TABLE kyc_verifications DROP FOREIGN KEY IF EXISTS kyc_verifications_ibfk_1;
ALTER TABLE kyc_verifications DROP FOREIGN KEY IF EXISTS kyc_verifications_ibfk_2;

-- Keep notifications table with FOREIGN KEY (as requested)
-- notifications table already has: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

SELECT 'Foreign keys removed for performance (except notifications)' AS status;

