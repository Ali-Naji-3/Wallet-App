-- Create payment_cards table for storing user payment cards
CREATE TABLE IF NOT EXISTS payment_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  card_holder_name VARCHAR(255) NOT NULL,
  card_number_encrypted TEXT NOT NULL,
  card_number_last4 VARCHAR(4) NOT NULL,
  card_type ENUM('visa', 'mastercard', 'amex', 'discover', 'other') DEFAULT 'other',
  expiry_month INT NOT NULL,
  expiry_year INT NOT NULL,
  cvv_encrypted TEXT NOT NULL,
  billing_address TEXT DEFAULT NULL,
  billing_city VARCHAR(100) DEFAULT NULL,
  billing_state VARCHAR(100) DEFAULT NULL,
  billing_zip VARCHAR(20) DEFAULT NULL,
  billing_country VARCHAR(100) DEFAULT NULL,
  is_default TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cards_user (user_id),
  INDEX idx_cards_active (is_active),
  CONSTRAINT fk_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add some indexes for performance
CREATE INDEX idx_cards_default ON payment_cards(user_id, is_default) WHERE is_default = 1;
CREATE INDEX idx_cards_type ON payment_cards(card_type);


