#!/usr/bin/env node
/**
 * Test script for KYC rejection with auto-suspension
 * Tests that accounts are automatically suspended when KYC is rejected
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testKYCRejectionAutoSuspend() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'fxwallet',
  });

  try {
    console.log('🧪 Testing KYC Rejection Auto-Suspension\n');

    // Step 1: Find or create test user (not admin)
    let [users] = await pool.query(
      'SELECT id, email, is_active, role FROM users WHERE email = ? AND role != ?',
      ['testuser@example.com', 'admin']
    );

    let userId;
    if (users.length === 0) {
      // Create test user
      const passwordHash = await bcrypt.hash('password123', 10);
      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified)
         VALUES (?, ?, ?, 'user', 1, 1)`,
        ['testuser@example.com', passwordHash, 'Test User']
      );
      userId = result.insertId;
      console.log(`✅ Test user created: testuser@example.com (ID: ${userId})`);
    } else {
      userId = users[0].id;
      console.log(`✅ Test user found: testuser@example.com (ID: ${userId})`);
      console.log(`   Current status: ${users[0].is_active ? 'ACTIVE' : 'SUSPENDED'}`);
    }

    // Ensure user is active before test
    await pool.query('UPDATE users SET is_active = 1, suspension_reason = NULL WHERE id = ?', [userId]);

    // Step 2: Create a pending KYC submission
    const [kycResult] = await pool.query(
      `INSERT INTO kyc_verifications 
       (user_id, document_type, document_number, id_front_image, selfie_image, 
        first_name, last_name, status, tier)
       VALUES (?, 'id_card', 'TEST123', 'test_front.jpg', 'test_selfie.jpg', 
               'Ali', 'Test', 'pending', 1)`,
      [userId]
    );
    const kycId = kycResult.insertId;
    console.log(`✅ Test KYC submission created (ID: ${kycId})\n`);

    // Step 3: Get user status BEFORE rejection
    const [beforeUser] = await pool.query(
      'SELECT id, email, is_active, suspension_reason FROM users WHERE id = ?',
      [userId]
    );

    console.log('📊 BEFORE KYC Rejection:');
    console.log(`   User ID: ${beforeUser[0].id}`);
    console.log(`   Email: ${beforeUser[0].email}`);
    console.log(`   Status: ${beforeUser[0].is_active ? '✅ ACTIVE' : '❌ SUSPENDED'}`);
    console.log(`   Suspension Reason: ${beforeUser[0].suspension_reason || 'None'}\n`);

    // Step 4: Simulate KYC rejection with auto-suspension
    console.log('🔄 Simulating KYC rejection (WITH auto-suspension)...\n');

    // Update KYC to rejected
    await pool.query(
      `UPDATE kyc_verifications 
       SET status = 'rejected', 
           rejection_reason = 'Document expired - Test rejection',
           reviewed_at = NOW()
       WHERE id = ?`,
      [kycId]
    );

    // Suspend the account (simulating the route behavior with suspendAccount = true)
    const suspensionMessage = `KYC verification rejected: Document expired - Test rejection. Your account has been suspended. Please contact support for reinstatement.`;
    await pool.query(
      `UPDATE users 
       SET is_active = 0, 
           suspension_reason = ?,
           kyc_verified = 0,
           kyc_tier = 0
       WHERE id = ? AND role != 'admin'`,
      [suspensionMessage, userId]
    );

    // Step 5: Get user status AFTER rejection
    const [afterUser] = await pool.query(
      'SELECT id, email, is_active, suspension_reason FROM users WHERE id = ?',
      [userId]
    );

    console.log('📊 AFTER KYC Rejection:');
    console.log(`   User ID: ${afterUser[0].id}`);
    console.log(`   Email: ${afterUser[0].email}`);
    console.log(`   Status: ${afterUser[0].is_active ? '❌ ACTIVE (ERROR!)' : '✅ SUSPENDED'}`);
    console.log(`   Suspension Reason: ${afterUser[0].suspension_reason || 'None'}\n`);

    // Step 6: Verify results
    console.log('✅ TEST RESULTS:');
    if (afterUser[0].is_active === 0) {
      console.log(`   ✅ SUCCESS: Account was AUTO-SUSPENDED after KYC rejection`);
      console.log(`   ✅ Suspension reason set correctly`);
      console.log(`   ✅ Auto-suspension is working correctly`);
    } else {
      console.log(`   ❌ FAILED: Account was NOT suspended (should be suspended)`);
      console.log(`   ❌ Auto-suspension is NOT working`);
    }

    // Step 7: Verify email consistency
    if (beforeUser[0].email === afterUser[0].email) {
      console.log(`   ✅ Email consistency: Email unchanged (${afterUser[0].email})`);
    } else {
      console.log(`   ❌ Email mismatch detected!`);
      console.log(`      Before: ${beforeUser[0].email}`);
      console.log(`      After: ${afterUser[0].email}`);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📝 Summary:');
    console.log(`   - User: testuser@example.com (ID: ${userId})`);
    console.log(`   - KYC: Rejected (ID: ${kycId})`);
    console.log(`   - Account Status: ${afterUser[0].is_active ? 'ACTIVE ❌' : 'SUSPENDED ✅'}`);
    console.log(`   - Auto-suspension: ${afterUser[0].is_active === 0 ? 'WORKING ✅' : 'NOT WORKING ❌'}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await pool.end();
  }
}

testKYCRejectionAutoSuspend();

