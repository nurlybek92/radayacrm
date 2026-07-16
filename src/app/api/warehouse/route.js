import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'director' && session.role !== 'production')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { material_id, weight } = body;

    if (!material_id || !weight || isNaN(parseFloat(weight))) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const insert = db.prepare(`
      INSERT INTO inventory_transactions (raw_material_id, transaction_type, weight, created_by)
      VALUES (?, 'INCOME', ?, ?)
    `);
    
    insert.run(material_id, parseFloat(weight), session.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Warehouse API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
