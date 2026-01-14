
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { parseBearer } from '@/lib/auth';
import { requireAdmin } from '@/lib/admin';

export async function DELETE(req, { params }) {
    try {
        const token = parseBearer(req.headers.get('authorization') || undefined);
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await requireAdmin(token);

        // Next.js 16: params is a Promise
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id, 10);

        if (isNaN(id)) {
            return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
        }

        const pool = getPool();

        // Check if wallet exists
        const [existing] = await pool.query('SELECT id, balance FROM wallets WHERE id = ?', [id]);
        if (existing.length === 0) {
            return NextResponse.json({ message: 'Wallet not found' }, { status: 404 });
        }

        // Optional: Prevent deleting non-empty wallets? 
        // User requested "delete", usually implies force. 
        // But safety suggests warning. We'll proceed with SQL delete and catch conflicts.

        try {
            await pool.query('DELETE FROM wallets WHERE id = ?', [id]);
        } catch (sqlErr) {
            // Handle Foreign Key Constraint violation
            if (sqlErr.code === 'ER_ROW_IS_REFERENCED_2') {
                return NextResponse.json({ message: 'Cannot delete wallet: It has related transactions.' }, { status: 409 });
            }
            throw sqlErr;
        }

        return NextResponse.json({ message: 'Wallet deleted successfully' });

    } catch (err) {
        if (err.message === 'Unauthorized' || err.message.includes('Forbidden')) {
            return NextResponse.json({ message: err.message }, { status: err.message.includes('Forbidden') ? 403 : 401 });
        }
        console.error('Admin delete wallet error:', err);
        return NextResponse.json(
            { message: err?.message || 'Failed to delete wallet' },
            { status: 500 }
        );
    }
}
