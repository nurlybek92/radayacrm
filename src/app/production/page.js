import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { ProductionClient } from './ProductionClient';

export default async function ProductionPage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'director' && session.role !== 'production')) {
    redirect('/');
  }

  // Fetch Orders for production (excluding fully shipped)
  const orders = db.prepare(`
    SELECT o.id, c.name as client_name, o.order_date,
           p.name as product_name, p.type as product_type,
           i.quantity, i.total_weight,
           (SELECT status_code FROM order_status_history WHERE order_id = o.id ORDER BY changed_at DESC LIMIT 1) as current_status
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN order_items i ON o.id = i.order_id
    JOIN products_catalog p ON i.product_id = p.id
    ORDER BY o.order_date DESC
  `).all();

  // Filter out shipped unless we want them in a column
  return <ProductionClient orders={orders} session={session} />;
}
