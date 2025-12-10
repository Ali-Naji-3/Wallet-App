#!/usr/bin/env node
// Quick authentication test
const API = 'http://localhost:5001';

async function test() {
  console.log('🧪 Quick Auth Test\n');
  
  // Test 1: Login
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin123' })
    });
    const data = await res.json();
    if (data.token) {
      console.log('✅ Login: PASS');
      const token = data.token;
      
      // Test 2: Verify token
      const meRes = await fetch(`${API}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meRes.json();
      if (meData.email) {
        console.log('✅ Token Verify: PASS');
        console.log(`   User: ${meData.email}`);
      } else {
        console.log('❌ Token Verify: FAIL');
      }
    } else {
      console.log('❌ Login: FAIL -', data.message);
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

test();

