import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'director' && session.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, amount, payment_type } = await request.json();
    const parsedAmount = parseFloat(amount);

    if (!order_id || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Insert payment with type
    const insertPayment = db.prepare(`
      INSERT INTO payments (order_id, amount, payment_type, created_by)
      VALUES (?, ?, ?, ?)
    `);
    insertPayment.run(order_id, parsedAmount, payment_type, session.id);

    // Check if fully paid
    const order = db.prepare('SELECT total_amount FROM orders WHERE id = ?').get(order_id);
    const paid = db.prepare('SELECT SUM(amount) as paid FROM payments WHERE order_id = ?').get(order_id);

    if (paid.paid >= order.total_amount) {
      db.prepare('UPDATE orders SET is_fully_paid = 1 WHERE id = ?').run(order_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
