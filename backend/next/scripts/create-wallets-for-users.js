/**
 * Script to create default wallets for all users who don't have them
 * Run this once to fix existing users
 */

import { getPool } from '../lib/db.js';

const currencyConfig = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
];

function buildWalletAddress(currencyCode) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `FXW-${currencyCode}-${random}`;
}

async function createWalletsForUsers() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking users...');
    
    // 1. Ensure currencies table has all currencies
    console.log('📋 Ensuring currencies exist...');
    for (const curr of currencyConfig) {
      await pool.query(
        `INSERT INTO currencies (code, name, symbol, is_active) 
         VALUES (?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), symbol = VALUES(symbol)`,
        [curr.code, curr.name, curr.symbol]
      );
    }
    console.log('✅ Currencies ready');
    
    // 2. Get all users
    const [users] = await pool.query('SELECT id, email FROM users');
    console.log(`\n👥 Found ${users.length} users`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found. Create a user first!');
      process.exit(0);
    }
    
    let totalCreated = 0;
    
    // 3. For each user, create wallets if they don't exist
    for (const user of users) {
      console.log(`\n📝 Processing user: ${user.email} (ID: ${user.id})`);
      
      for (const curr of currencyConfig) {
        // Check if wallet exists
        const [existing] = await pool.query(
          `SELECT id FROM wallets WHERE user_id = ? AND currency_code = ?`,
          [user.id, curr.code]
        );
        
        if (existing.length === 0) {
          // Create wallet
          const address = buildWalletAddress(curr.code);
          await pool.query(
            `INSERT INTO wallets (user_id, currency_code, address, balance, status)
             VALUES (?, ?, ?, 0, 'active')`,
            [user.id, curr.code, address]
          );
          console.log(`  ✅ Created ${curr.code} wallet: ${address}`);
          totalCreated++;
        } else {
          console.log(`  ⏭️  ${curr.code} wallet already exists`);
        }
      }
    }
    
    console.log(`\n✨ Done! Created ${totalCreated} wallets`);
    console.log('🎉 All users now have wallets for all currencies');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
createWalletsForUsers();

