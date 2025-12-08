#!/usr/bin/env node
/**
 * Quick test script to verify JWT_SECRET is configured correctly
 * Usage: node test-jwt-config.js
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const secret = process.env.JWT_SECRET;

console.log('\n🔍 Testing JWT_SECRET Configuration\n');
console.log('─'.repeat(50));

// Check if JWT_SECRET exists
if (!secret) {
  console.error('❌ JWT_SECRET not found in environment variables');
  console.error('   Make sure backend/.env exists and contains JWT_SECRET=');
  process.exit(1);
}

// Check length
const length = secret.length;
if (length < 32) {
  console.warn('⚠️  JWT_SECRET is shorter than recommended (32 characters)');
  console.warn(`   Current length: ${length} characters`);
  console.warn('   Consider using at least 32 characters for security');
} else {
  console.log(`✅ JWT_SECRET found (${length} characters)`);
}

// Test JWT token creation
try {
  const testPayload = {
    id: 1,
    email: 'test@example.com',
    role: 'user'
  };

  const token = jwt.sign(testPayload, secret, { expiresIn: '1d' });
  console.log('✅ JWT token creation: SUCCESS');
  console.log(`   Token preview: ${token.substring(0, 50)}...`);

  // Test JWT token verification
  const decoded = jwt.verify(token, secret);
  console.log('✅ JWT token verification: SUCCESS');
  console.log(`   Decoded payload:`, decoded);

  console.log('\n─'.repeat(50));
  console.log('✅ All tests passed! JWT_SECRET is properly configured.\n');
  console.log('📝 Next steps:');
  console.log('   1. Start your server: npm run dev');
  console.log('   2. Test login to create real JWT tokens');
  console.log('   3. Use tokens in Authorization headers\n');

} catch (error) {
  console.error('❌ JWT operation failed:', error.message);
  process.exit(1);
}

