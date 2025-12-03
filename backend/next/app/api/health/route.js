import { NextResponse } from 'next/server';
import { pingDb } from '@/lib/db';

export async function GET() {
  try {
    await pingDb();
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: err?.message || 'DB error' }, { status: 500 });
  }
}

