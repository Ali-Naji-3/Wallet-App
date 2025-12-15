#!/usr/bin/env node
import fetch from 'node-fetch';

const test = async () => {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@admin.com', password: 'admin123' })
    });
    const data = await res.json();
    if (data.token) {
      console.log('✅ Login WORKS!');
      console.log('Email:', data.user?.email);
      console.log('Role:', data.user?.role);
    } else {
      console.log('❌ Login FAILED:', data.message);
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
};

test();



