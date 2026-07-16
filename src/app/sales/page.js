import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { SalesClient } from './SalesClient';

export default async function SalesPage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'director' && session.role !== 'sales' && session.role !== 'accounting')) {
    redirect('/');
  }

  // Fetch Clients
  let clients;
  if (session.role === 'director' || session.role === 'accounting') {
    clients = db.prepare('SELECT id, name FROM clients ORDER BY name').all();
  } else {
    clients = db.prepare('SELECT id, name FROM clients WHERE assigned_manager_id = ? ORDER BY name').all(session.id);
  }
  
  // Fetch Products
  const products = db.prepare('SELECT id, name, type, weight_formula FROM products_catalog').all();
  
  // Fetch Orders with latest status and payment calculation
  let ordersQuery = `
    SELECT o.id, c.name as client_name, o.total_amount, o.is_fully_paid,
           (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE order_id = o.id) as paid_amount,
           (SELECT status_code FROM order_status_history WHERE order_id = o.id ORDER BY changed_at DESC LIMIT 1) as current_status,
           u.full_name as manager_name
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN users u ON o.manager_id = u.id
  `;

  let orders;
  if (session.role === 'director' || session.role === 'accounting') {
    orders = db.prepare(ordersQuery + ' ORDER BY o.order_date DESC').all();
  } else {
    orders = db.prepare(ordersQuery + ' WHERE o.manager_id = ? ORDER BY o.order_date DESC').all(session.id);
  }

  return <SalesClient orders={orders} clients={clients} products={products} session={session} />;
}
