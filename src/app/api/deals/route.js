import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'director' && session.role !== 'sales')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { clientName, phone, volumeRequested, amount, deadlineDate, managerId } = await request.json();

    if (!clientName || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return NextResponse.json({ error: 'Заполните обязательные поля (Имя клиента, сумма)' }, { status: 400 });
    }

    // Manager assignment RLS check
    const finalManagerId = session.role === 'director' && managerId ? parseInt(managerId, 10) : session.id;

    const stmt = db.prepare(`
      INSERT INTO deals (client_name, phone, volume_requested, amount, manager_id, status, deadline_date)
      VALUES (?, ?, ?, ?, ?, 'new', ?)
    `);
    
    const result = stmt.run(
      clientName,
      phone || '',
      parseInt(volumeRequested || 0, 10),
      parseFloat(amount),
      finalManagerId,
      deadlineDate || null
    );

    return NextResponse.json({ success: true, dealId: result.lastInsertRowid });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = parseInt(searchParams.get('id'), 10);

    if (isNaN(dealId)) {
      return NextResponse.json({ error: 'Неверный ID сделки' }, { status: 400 });
    }

    const deal = db.prepare('SELECT manager_id FROM deals WHERE id = ?').get(dealId);
    if (!deal) {
      return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 });
    }

    const isAuthorized = session.role === 'director' || session.id === deal.manager_id;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'У вас нет прав для удаления этой сделки' }, { status: 403 });
    }

    const deleteStmt = db.prepare('DELETE FROM deals WHERE id = ?');
    deleteStmt.run(dealId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
