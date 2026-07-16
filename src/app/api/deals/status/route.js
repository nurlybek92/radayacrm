import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { dealId, newStatus } = await request.json();

    if (!dealId || !newStatus) {
      return NextResponse.json({ error: 'Неверные параметры запроса' }, { status: 400 });
    }

    const deal = db.prepare('SELECT manager_id FROM deals WHERE id = ?').get(dealId);
    if (!deal) {
      return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 });
    }

    // Role verification for changing deal status
    const isAuthorized = session.role === 'director' || session.role === 'accountant' || session.id === deal.manager_id;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'У вас нет прав на изменение этой сделки' }, { status: 403 });
    }

    const stmt = db.prepare('UPDATE deals SET status = ? WHERE id = ?');
    stmt.run(newStatus, dealId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update deal status error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
