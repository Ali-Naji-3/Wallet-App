import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// Helper function to detect card type from number
const detectCardType = (cardNumber) => {
  const number = cardNumber.replace(/\s/g, '');
  
  if (/^4/.test(number)) return 'visa';
  if (/^(5[1-5]|2(2(2[1-9]|[3-9])|[3-6]|7([01]|20)))/.test(number)) return 'mastercard';
  if (/^3[47]/.test(number)) return 'amex';
  if (/^(6011|65|64[4-9]|622)/.test(number)) return 'discover';
  
  return 'other';
};

// Luhn algorithm for card validation
const validateCardNumber = (cardNumber) => {
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
const ENCRYPTION_KEY = process.env.CARD_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

const encryptCardData = (data) => {
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

// GET - List user's cards
export async function GET(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const [cards] = await pool.query(
      `SELECT 
        id, card_holder_name, card_number_last4, card_type,
        expiry_month, expiry_year, is_default, is_active,
        billing_city, billing_state, billing_country,
        created_at, updated_at
      FROM payment_cards
      WHERE user_id = ? AND is_active = 1
      ORDER BY is_default DESC, created_at DESC`,
      [user.id]
    );

    return NextResponse.json(cards);
  } catch (err) {
    console.error('List cards error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to list cards' },
      { status: 500 }
    );
  }
}

// POST - Add a new card
export async function POST(req) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      cardHolderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      isDefault
    } = body;

    // Validation
    if (!cardHolderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate card number
    if (!validateCardNumber(cardNumber)) {
      return NextResponse.json(
        { message: 'Invalid card number' },
        { status: 400 }
      );
    }

    // Validate expiry date
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return NextResponse.json(
        { message: 'Card has expired' },
        { status: 400 }
      );
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return NextResponse.json(
        { message: 'Invalid CVV' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Detect card type
    const cardType = detectCardType(cardNumber);
    
    // Encrypt sensitive data
    const encryptedNumber = encryptCardData(cardNumber.replace(/\s/g, ''));
    const encryptedCVV = encryptCardData(cvv);
    
    // Get last 4 digits
    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    
    // If this is marked as default, unset other default cards
    if (isDefault) {
      await pool.query(
        'UPDATE payment_cards SET is_default = 0 WHERE user_id = ?',
        [user.id]
      );
    }
    
    // Insert the new card
    const [result] = await pool.query(
      `INSERT INTO payment_cards (
        user_id, card_holder_name, card_number_encrypted, card_number_last4,
        card_type, expiry_month, expiry_year, cvv_encrypted,
        billing_address, billing_city, billing_state, billing_zip, billing_country,
        is_default, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        cardHolderName,
        encryptedNumber,
        last4,
        cardType,
        parseInt(expiryMonth),
        parseInt(expiryYear),
        encryptedCVV,
        billingAddress || null,
        billingCity || null,
        billingState || null,
        billingZip || null,
        billingCountry || null,
        isDefault ? 1 : 0,
        1
      ]
    );

    return NextResponse.json(
      {
        message: 'Card added successfully',
        cardId: result.insertId
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Add card error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to add card' },
      { status: 500 }
    );
  }
}


