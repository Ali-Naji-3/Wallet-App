import { getPool } from '../config/db.js';

export const ensureCardTable = async () => {
  const pool = getPool();
  const sql = `
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
  `;
  await pool.query(sql);
};

// Helper function to detect card type from number
export const detectCardType = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  
  // Visa
  if (/^4/.test(number)) return 'visa';
  
  // Mastercard
  if (/^(5[1-5]|2(2(2[1-9]|[3-9])|[3-6]|7([01]|20)))/.test(number)) return 'mastercard';
  
  // American Express
  if (/^3[47]/.test(number)) return 'amex';
  
  // Discover
  if (/^(6011|65|64[4-9]|622)/.test(number)) return 'discover';
  
  return 'other';
};

// Simple card number validation (Luhn algorithm)
export const validateCardNumber = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(number)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

// Simple encryption (In production, use proper encryption like AES-256)
// For demo purposes, we'll use base64 encoding with a simple XOR
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

export const encryptCardData = (data) => {
  try {
    const buffer = Buffer.from(data, 'utf8');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const encrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      encrypted[i] = buffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return encrypted.toString('base64');
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt card data');
  }
};

export const decryptCardData = (encryptedData) => {
  try {
    const encrypted = Buffer.from(encryptedData, 'base64');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf8');
    const decrypted = Buffer.alloc(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Failed to decrypt card data');
  }
};

// Add a new card
export const addCard = async (userId, cardData) => {
  const pool = getPool();
  
  // Validate card number
  if (!validateCardNumber(cardData.cardNumber)) {
    throw new Error('Invalid card number');
  }
  
  // Detect card type
  const cardType = detectCardType(cardData.cardNumber);
  
  // Encrypt sensitive data
  const encryptedNumber = encryptCardData(cardData.cardNumber.replace(/\s/g, ''));
  const encryptedCVV = encryptCardData(cardData.cvv);
  
  // Get last 4 digits
  const last4 = cardData.cardNumber.replace(/\s/g, '').slice(-4);
  
  // If this is marked as default, unset other default cards
  if (cardData.isDefault) {
    await pool.query(
      'UPDATE payment_cards SET is_default = 0 WHERE user_id = ?',
      [userId]
    );
  }
  
  const [result] = await pool.query(
    `INSERT INTO payment_cards (
      user_id, card_holder_name, card_number_encrypted, card_number_last4,
      card_type, expiry_month, expiry_year, cvv_encrypted,
      billing_address, billing_city, billing_state, billing_zip, billing_country,
      is_default, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      cardData.cardHolderName,
      encryptedNumber,
      last4,
      cardType,
      cardData.expiryMonth,
      cardData.expiryYear,
      encryptedCVV,
      cardData.billingAddress || null,
      cardData.billingCity || null,
      cardData.billingState || null,
      cardData.billingZip || null,
      cardData.billingCountry || null,
      cardData.isDefault ? 1 : 0,
      1
    ]
  );
  
  return result.insertId;
};

// List user's cards (without sensitive data)
export const listUserCards = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT 
      id, card_holder_name, card_number_last4, card_type,
      expiry_month, expiry_year, is_default, is_active,
      billing_city, billing_state, billing_country,
      created_at, updated_at
    FROM payment_cards
    WHERE user_id = ? AND is_active = 1
    ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows;
};

// Get a specific card (with decrypted data - use carefully)
export const getCard = async (cardId, userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM payment_cards
     WHERE id = ? AND user_id = ? AND is_active = 1`,
    [cardId, userId]
  );
  
  if (rows.length === 0) {
    throw new Error('Card not found');
  }
  
  return rows[0];
};

// Delete a card (soft delete)
export const deleteCard = async (cardId, userId) => {
  const pool = getPool();
  const [result] = await pool.query(
    'UPDATE payment_cards SET is_active = 0 WHERE id = ? AND user_id = ?',
    [cardId, userId]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Card not found');
  }
  
  return true;
};

// Set card as default
export const setDefaultCard = async (cardId, userId) => {
  const pool = getPool();
  
  // Unset all default cards first
  await pool.query(
    'UPDATE payment_cards SET is_default = 0 WHERE user_id = ?',
    [userId]
  );
  
  // Set the selected card as default
  const [result] = await pool.query(
    'UPDATE payment_cards SET is_default = 1 WHERE id = ? AND user_id = ? AND is_active = 1',
    [cardId, userId]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Card not found');
  }
  
  return true;
};


