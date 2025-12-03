#!/usr/bin/env node

/**
 * Generate a secure JWT_SECRET
 * Usage: node generate-jwt-secret.js
 */

import crypto from 'crypto';

// Generate a random 64-byte (512-bit) secret
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated JWT_SECRET:\n');
console.log(secret);
console.log('\n📝 Add this to your .env files:\n');
console.log(`JWT_SECRET=${secret}\n`);
console.log('✅ Copy the line above to:');
console.log('   - backend/.env');
console.log('   - backend/next/.env.local\n');

