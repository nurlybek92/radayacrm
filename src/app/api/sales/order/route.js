import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'director' && session.role !== 'sales')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      client_id,
      isNewClient,
      newClientName,
      newClientContact,
      product_id,
      raw_material_id,
      quantity,
      total_weight,
      total_amount,
      price_per_unit
    } = await request.json();

    if ((!client_id && !isNewClient) || !product_id || !quantity || !total_weight || !total_amount) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Wrap in a transaction to ensure everything is saved correctly
    const createOrder = db.transaction(() => {
      let actualClientId = client_id;
      
      // 0. Create client if new
      if (isNewClient && newClientName) {
        const insertClient = db.prepare('INSERT INTO clients (name, contact_info, assigned_manager_id) VALUES (?, ?, ?)');
        const clientRes = insertClient.run(newClientName, newClientContact || '', session.id);
        actualClientId = clientRes.lastInsertRowid;
      }

      // 1. Create order
      const insertOrder = db.prepare(`
        INSERT INTO orders (client_id, manager_id, total_amount, is_fully_paid)
        VALUES (?, ?, ?, 0)
      `);
      const orderResult = insertOrder.run(actualClientId, session.id, total_amount);
      const orderId = orderResult.lastInsertRowid;

      // 2. Create order item
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, total_weight, total_cost, raw_material_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertItem.run(orderId, product_id, quantity, total_weight, total_amount, raw_material_id);

      // 3. Reserve inventory
      const insertReserve = db.prepare(`
        INSERT INTO inventory_transactions (raw_material_id, transaction_type, weight, created_by)
        VALUES (?, 'RESERVE', ?, ?)
      `);
      insertReserve.run(raw_material_id, -total_weight, session.id);

      // 4. Add initial status history
      const insertHistory = db.prepare(`
        INSERT INTO order_status_history (order_id, status_code, changed_by)
        VALUES (?, 'RECEIVED', ?)
      `);
      insertHistory.run(orderId, session.id);

      return orderId;
    });

    const newOrderId = createOrder();

    return NextResponse.json({ success: true, orderId: newOrderId });
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
