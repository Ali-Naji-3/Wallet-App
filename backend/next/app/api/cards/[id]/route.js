import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer, verifyToken } from '@/lib/auth';

// DELETE - Remove a card (soft delete)
export async function DELETE(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const cardId = params.id;
    const pool = getPool();
    
    // Soft delete the card
    const [result] = await pool.query(
      'UPDATE payment_cards SET is_active = 0 WHERE id = ? AND user_id = ?',
      [cardId, user.id]
    );
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error('Delete card error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to delete card' },
      { status: 500 }
    );
  }
}

// PATCH - Update card (set as default)
export async function PATCH(req, { params }) {
  try {
    const token = parseBearer(req.headers.get('authorization') || undefined);
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const cardId = params.id;
    const body = await req.json();
    const pool = getPool();

    // Handle setting card as default
    if (body.setDefault) {
      // Unset all default cards first
      await pool.query(
        'UPDATE payment_cards SET is_default = 0 WHERE user_id = ?',
        [user.id]
      );
      
      // Set the selected card as default
      const [result] = await pool.query(
        'UPDATE payment_cards SET is_default = 1 WHERE id = ? AND user_id = ? AND is_active = 1',
        [cardId, user.id]
      );
      
      if (result.affectedRows === 0) {
        return NextResponse.json(
          { message: 'Card not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Card set as default' });
    }

    return NextResponse.json(
      { message: 'No valid update action provided' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Update card error:', err);
    return NextResponse.json(
      { message: err?.message || 'Failed to update card' },
      { status: 500 }
    );
  }
}


