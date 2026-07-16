import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { WarehouseClient } from './WarehouseClient';

export default async function WarehousePage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'director' && session.role !== 'production')) {
    redirect('/');
  }

  // 1. Raw Materials Stock
  const materials = db.prepare(`
    SELECT r.id, r.name, r.type, r.critical_limit, 
           COALESCE(SUM(t.weight), 0) as stock
    FROM raw_materials r
    LEFT JOIN inventory_transactions t ON r.id = t.raw_material_id
    GROUP BY r.id
  `).all();

  // 2. Transactions History
  const transactions = db.prepare(`
    SELECT t.id, t.transaction_type, t.weight, t.created_at, r.name as material_name, u.full_name as operator
    FROM inventory_transactions t
    JOIN raw_materials r ON t.raw_material_id = r.id
    JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
    LIMIT 50
  `).all();

  return <WarehouseClient materials={materials} transactions={transactions} session={session} />;
}
