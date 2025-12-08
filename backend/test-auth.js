#!/usr/bin/env node
/**
 * Test script for authentication (register and login)
 * Usage: node test-auth.js
 * 
 * This script will:
 * 1. Test user registration (creates JWT token)
 * 2. Test user login (creates JWT token)
 * 3. Test token verification (using /api/auth/me)
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:5001';
const TEST_EMAIL = `test${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
let authToken = null;

console.log('\n🧪 Testing Authentication Endpoints\n');
console.log('═'.repeat(60));
console.log(`API Base URL: ${API_BASE}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log('═'.repeat(60));

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { 
      status: 0, 
      error: error.message,
      data: { message: `Network error: ${error.message}` }
    };
  }
}

// Test 1: User Registration
async function testRegister() {
  console.log('\n📝 Test 1: User Registration');
  console.log('─'.repeat(60));

  const { status, data, error } = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      fullName: 'Test User',
      baseCurrency: 'USD',
      timezone: 'UTC',
    }),
  });

  if (status === 201 && data.token) {
    console.log('✅ Registration successful!');
    console.log(`   Status: ${status}`);
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Token (first 50 chars): ${data.token.substring(0, 50)}...`);
    authToken = data.token;
    return true;
  } else {
    console.log(`❌ Registration failed!`);
    console.log(`   Status: ${status}`);
    console.log(`   Error: ${data.message || error || 'Unknown error'}`);
    return false;
  }
}

// Test 2: User Login
async function testLogin() {
  console.log('\n🔐 Test 2: User Login');
  console.log('─'.repeat(60));

  const { status, data, error } = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (status === 200 && data.token) {
    console.log('✅ Login successful!');
    console.log(`   Status: ${status}`);
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   Email: ${data.user?.email}`);
    console.log(`   Token (first 50 chars): ${data.token.substring(0, 50)}...`);
    authToken = data.token; // Update token
    return true;
  } else {
    console.log(`❌ Login failed!`);
    console.log(`   Status: ${status}`);
    console.log(`   Error: ${data.message || error || 'Unknown error'}`);
    return false;
  }
}

// Test 3: Token Verification (Get Profile)
async function testTokenVerification() {
  console.log('\n🔍 Test 3: Token Verification (GET /api/auth/me)');
  console.log('─'.repeat(60));

  if (!authToken) {
    console.log('⚠️  No token available. Skipping verification test.');
    return false;
  }

  const { status, data, error } = await apiRequest('/api/auth/me');

  if (status === 200 && data.id) {
    console.log('✅ Token verification successful!');
    console.log(`   Status: ${status}`);
    console.log(`   User ID: ${data.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Full Name: ${data.full_name || 'N/A'}`);
    console.log(`   Base Currency: ${data.base_currency || 'N/A'}`);
    return true;
  } else {
    console.log(`❌ Token verification failed!`);
    console.log(`   Status: ${status}`);
    console.log(`   Error: ${data.message || error || 'Unknown error'}`);
    return false;
  }
}

// Test 4: Invalid Token
async function testInvalidToken() {
  console.log('\n🚫 Test 4: Invalid Token Test');
  console.log('─'.repeat(60));

  const oldToken = authToken;
  authToken = 'invalid.token.here';

  const { status, data } = await apiRequest('/api/auth/me');

  authToken = oldToken; // Restore valid token

  if (status === 401) {
    console.log('✅ Invalid token correctly rejected!');
    console.log(`   Status: ${status}`);
    return true;
  } else {
    console.log(`⚠️  Unexpected response for invalid token`);
    console.log(`   Status: ${status}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    register: false,
    login: false,
    verification: false,
    invalidToken: false,
  };

  // Test registration
  results.register = await testRegister();

  // Test login (only if registration succeeded or user already exists)
  results.login = await testLogin();

  // Test token verification (only if we have a token)
  if (authToken) {
    results.verification = await testTokenVerification();
    results.invalidToken = await testInvalidToken();
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Summary');
  console.log('═'.repeat(60));
  console.log(`Registration:     ${results.register ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login:            ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Verify:     ${results.verification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Token:    ${results.invalidToken ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═'.repeat(60));

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n🎉 All tests passed! JWT authentication is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.\n');
    process.exit(1);
  }
}

// Check if server is reachable first
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('\n❌ Server is not running!');
    console.error(`   Cannot connect to ${API_BASE}`);
    console.error('\n📝 Please start your server first:');
    console.error('   cd /home/naji/Desktop/Wallet App/backend');
    console.error('   npm run dev\n');
    process.exit(1);
  }

  await runTests();
})();

