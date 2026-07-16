import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { DashboardCharts } from '@/components/DashboardCharts';
import { TrendingUp, Package, Users, Activity, AlertTriangle } from 'lucide-react';
import MonthFilter from '@/components/MonthFilter';

export default async function DashboardPage({ searchParams }) {
  const session = await getSession();
  
  if (!session || (session.role !== 'director' && session.role !== 'accounting')) {
    redirect('/');
  }

  // 1. Raw Materials Stock
  const materialsData = db.prepare(`
    SELECT r.id, r.name, r.critical_limit, 
           COALESCE(SUM(t.weight), 0) as stock
    FROM raw_materials r
    LEFT JOIN inventory_transactions t ON r.id = t.raw_material_id
    GROUP BY r.id
  `).all();

  // 1.5 Forecast Raw Materials Need
  const consumptionData = db.prepare(`
    SELECT r.id as raw_material_id, r.name, 
           COALESCE(SUM(ABS(t.weight)) / MAX(1, COUNT(DISTINCT strftime('%Y-%m', t.created_at))), 0) as avg_monthly_consumption
    FROM raw_materials r
    LEFT JOIN inventory_transactions t ON r.id = t.raw_material_id AND t.transaction_type = 'RESERVE'
    GROUP BY r.id
  `).all();

  const materials = materialsData.map(mat => {
    const consumption = consumptionData.find(c => c.raw_material_id === mat.id)?.avg_monthly_consumption || 0;
    return {
      ...mat,
      forecast: consumption,
      deficit: consumption > mat.stock ? consumption - mat.stock : 0
    };
  });

  // 2. Sales Dynamics (Grouped by Month & Year for filtering)
  const monthlySales = db.prepare(`
    SELECT strftime('%Y', order_date) as year, strftime('%Y-%m', order_date) as month, SUM(total_amount) as total
    FROM orders
    GROUP BY month
    ORDER BY month ASC
  `).all();

  // 3. Manager Efficiency
  const managerSales = db.prepare(`
    SELECT u.full_name as manager, SUM(o.total_amount) as total, strftime('%Y', order_date) as year
    FROM orders o
    JOIN users u ON o.manager_id = u.id
    GROUP BY o.manager_id, year
  `).all();

  // 4. Products Distribution
  const productSales = db.prepare(`
    SELECT p.name as product, SUM(i.total_cost) as total, strftime('%Y', o.order_date) as year
    FROM order_items i
    JOIN products_catalog p ON i.product_id = p.id
    JOIN orders o ON i.order_id = o.id
    GROUP BY i.product_id, year
  `).all();

  // 5. Accounts Receivable (Debtors)
  const rawDebtors = db.prepare(`
    SELECT c.name as client_name, o.id, o.total_amount, 
           COALESCE((SELECT SUM(amount) FROM payments WHERE order_id = o.id), 0) as paid_amount
    FROM orders o 
    JOIN clients c ON o.client_id = c.id 
    WHERE o.is_fully_paid = 0
  `).all();
  
  const totalDebt = rawDebtors.reduce((acc, curr) => acc + (curr.total_amount - curr.paid_amount), 0);
  
  // Aggregate debt by client
  const debtByClient = {};
  rawDebtors.forEach(d => {
    const debt = d.total_amount - d.paid_amount;
    if (debt > 0) {
      if (!debtByClient[d.client_name]) debtByClient[d.client_name] = 0;
      debtByClient[d.client_name] += debt;
    }
  });
  const topDebtors = Object.entries(debtByClient)
    .map(([name, debt]) => ({ name, debt }))
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 5);

  // 6. Top Clients (ABC Analysis)
  const topClients = db.prepare(`
    SELECT c.name as client_name, SUM(o.total_amount) as total, strftime('%Y', o.order_date) as year
    FROM orders o 
    JOIN clients c ON o.client_id = c.id 
    GROUP BY c.id, year
    ORDER BY total DESC
  `).all();

  // 7. Production Load
  const productionLoadRaw = db.prepare(`
    SELECT o.id, o.total_amount, i.total_weight, strftime('%Y', o.order_date) as year,
           (SELECT status_code FROM order_status_history WHERE order_id = o.id ORDER BY changed_at DESC LIMIT 1) as current_status
    FROM orders o
    JOIN order_items i ON o.id = i.order_id
  `).all();
  
  const prodLoad = {
    in_work_value: 0,
    in_work_weight: 0,
    ready_value: 0,
    ready_weight: 0
  };
  
  productionLoadRaw.forEach(o => {
    if (o.current_status === 'RECEIVED' || o.current_status === 'CAST') {
      prodLoad.in_work_value += o.total_amount;
      prodLoad.in_work_weight += o.total_weight;
    } else if (o.current_status === 'READY') {
      prodLoad.ready_value += o.total_amount;
      prodLoad.ready_weight += o.total_weight;
    }
  });

  const currentMonthDate = new Date();
  const defaultMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;
  // Await searchParams as per Next.js 15+ or standard practice, though Next.js <15 it's a prop
  const sp = await searchParams;
  const filterMonth = sp?.month || defaultMonth;

  // Get distinct months for the dropdown
  const distinctMonths = db.prepare(`
    SELECT DISTINCT strftime('%Y-%m', order_date) as month
    FROM orders
    ORDER BY month DESC
  `).all().map(r => r.month);
  
  if (!distinctMonths.includes(defaultMonth)) {
    distinctMonths.unshift(defaultMonth);
  }

  // Calculate revenue and orders count for the selected month (or all time)
  let totalRevenue = 0;
  let totalOrdersCount = 0;
  
  if (filterMonth === 'all') {
    const allQuery = db.prepare(`SELECT SUM(total_amount) as total_revenue, COUNT(id) as total_orders FROM orders`).get();
    totalRevenue = allQuery.total_revenue || 0;
    totalOrdersCount = allQuery.total_orders || 0;
  } else {
    const monthQuery = db.prepare(`
      SELECT SUM(total_amount) as total_revenue, COUNT(id) as total_orders 
      FROM orders 
      WHERE strftime('%Y-%m', order_date) = ?
    `).get(filterMonth);
    totalRevenue = monthQuery.total_revenue || 0;
    totalOrdersCount = monthQuery.total_orders || 0;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Дашборд Руководителя</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <MonthFilter currentMonth={filterMonth} distinctMonths={distinctMonths} />
          <div className="badge badge-blue">Обновлено только что</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="form-label">Общая выручка</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalRevenue.toLocaleString('ru-RU')} ₸</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Количество заказов: {totalOrdersCount}</span>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--success-glow)', color: 'var(--success)', borderRadius: '0.5rem' }}>
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="form-label">Дебиторская задолженность</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--danger)' }}>{totalDebt.toLocaleString('ru-RU')} ₸</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>Ожидаемые поступления</span>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--danger-glow)', color: 'var(--danger)', borderRadius: '0.5rem' }}>
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="form-label">Загрузка производства (В работе)</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{prodLoad.in_work_value.toLocaleString('ru-RU')} ₸</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Объем: {prodLoad.in_work_weight.toLocaleString('ru-RU')} кг</span>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '0.5rem' }}>
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Forecast Alerts */}
        {materials.map(mat => {
          const isRedline = mat.critical_limit > mat.stock;
          const isDeficit = mat.deficit > 0;
          
          return (
            <div key={mat.id} className="card" style={{ borderTop: (isRedline || isDeficit) ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Прогноз: {mat.name}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Текущий остаток:</span>
                <span style={{ fontWeight: 800, color: isRedline ? 'var(--danger)' : 'inherit' }}>{mat.stock.toLocaleString('ru-RU')} кг</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Прогноз расхода (мес):</span>
                <span style={{ fontWeight: 800 }}>{mat.forecast.toLocaleString('ru-RU', {maximumFractionDigits: 0})} кг</span>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                {isDeficit ? (
                  <div style={{ color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle className="w-4 h-4" /> 
                    Необходим закуп: {mat.deficit.toLocaleString('ru-RU', {maximumFractionDigits: 0})} кг
                  </div>
                ) : (
                  <div style={{ color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package className="w-4 h-4" /> 
                    Сырья достаточно на след. месяц
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="card">
           <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>Топ-5 должников</h3>
           <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
             <tbody>
               {topDebtors.map((d, i) => (
                 <tr key={i}>
                   <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{d.name}</td>
                   <td style={{ padding: '0.5rem 0', textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>
                     {d.debt.toLocaleString('ru-RU')} ₸
                   </td>
                 </tr>
               ))}
               {topDebtors.length === 0 && (
                 <tr><td colSpan="2" style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Нет задолженностей</td></tr>
               )}
             </tbody>
           </table>
        </div>
      </div>

      {/* Charts with Filter */}
      <DashboardCharts 
        monthlySales={monthlySales} 
        managerSales={managerSales} 
        productSales={productSales} 
        topClients={topClients}
        orderStatuses={productionLoadRaw}
      />
    </div>
  );
}
