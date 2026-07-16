import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, status } = await request.json();

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Role restrictions
    if (status === 'SHIPPED' && session.role !== 'director' && session.role !== 'sales') {
      return NextResponse.json({ error: 'Only sales or director can ship orders' }, { status: 403 });
    }

    const insertHistory = db.prepare(`
      INSERT INTO order_status_history (order_id, status_code, changed_by)
      VALUES (?, ?, ?)
    `);
    
    insertHistory.run(order_id, status, session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
