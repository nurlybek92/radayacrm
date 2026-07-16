'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function DashboardCharts({ monthlySales, managerSales, productSales, topClients, orderStatuses }) {
  const [filterYear, setFilterYear] = useState('all'); // 'all', '2025', '2026'

  // Extract unique years from the data to build the filter options
  const years = Array.from(new Set(monthlySales.map(s => s.year))).sort((a, b) => b - a);

  // Filter Data
  const filteredMonthly = monthlySales.filter(s => filterYear === 'all' || s.year === filterYear);
  const filteredManagers = managerSales.filter(s => filterYear === 'all' || s.year === filterYear);
  const filteredProducts = productSales.filter(s => filterYear === 'all' || s.year === filterYear);
  const filteredClients = topClients.filter(s => filterYear === 'all' || s.year === filterYear)
    .sort((a, b) => b.total - a.total).slice(0, 5); // top 5 after filter
  const filteredStatuses = orderStatuses.filter(s => filterYear === 'all' || s.year === filterYear);

  // Group by manager after filter
  const managerTotals = {};
  filteredManagers.forEach(m => {
    managerTotals[m.manager] = (managerTotals[m.manager] || 0) + m.total;
  });

  // Group by product after filter
  const productTotals = {};
  filteredProducts.forEach(p => {
    productTotals[p.product] = (productTotals[p.product] || 0) + p.total;
  });

  // Group by status after filter
  const statusTotals = {
    'Новый': 0,
    'В производстве': 0,
    'Готов на складе': 0,
    'Отгружен': 0
  };
  
  filteredStatuses.forEach(s => {
    if (s.current_status === 'RECEIVED') statusTotals['Новый']++;
    else if (s.current_status === 'CAST') statusTotals['В производстве']++;
    else if (s.current_status === 'READY') statusTotals['Готов на складе']++;
    else if (s.current_status === 'SHIPPED') statusTotals['Отгружен']++;
  });

  const lineChartData = {
    labels: filteredMonthly.map(d => d.month),
    datasets: [
      {
        label: 'Выручка (тг)',
        data: filteredMonthly.map(d => d.total),
        borderColor: '#004C97',
        backgroundColor: 'rgba(0, 76, 151, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const managerChartData = {
    labels: Object.keys(managerTotals),
    datasets: [
      {
        label: 'Продажи',
        data: Object.values(managerTotals),
        backgroundColor: ['#004C97', '#27AE60', '#F39C12', '#E74C3C', '#9b59b6'],
      }
    ]
  };

  const productChartData = {
    labels: Object.keys(productTotals),
    datasets: [
      {
        label: 'Продажи по продуктам',
        data: Object.values(productTotals),
        backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
      }
    ]
  };

  const orderedStatuses = ['Новый', 'В производстве', 'Готов на складе', 'Отгружен'];
  const statusChartData = {
    labels: orderedStatuses,
    datasets: [
      {
        label: 'Кол-во заказов',
        data: orderedStatuses.map(s => statusTotals[s]),
        backgroundColor: ['#95a5a6', '#f1c40f', '#3498db', '#2ecc71'], // Gray, Yellow, Blue, Green
      }
    ]
  };

  const clientsChartData = {
    labels: filteredClients.map(c => c.client_name),
    datasets: [
      {
        label: 'Сумма покупок',
        data: filteredClients.map(c => c.total),
        backgroundColor: 'rgba(0, 76, 151, 0.8)',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Аналитические сводки</h2>
        <select 
          className="form-input" 
          style={{ width: '200px' }} 
          value={filterYear} 
          onChange={e => setFilterYear(e.target.value)}
        >
          <option value="all">За всё время</option>
          {years.map(y => <option key={y} value={y}>{y} год</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ gridColumn: '1 / -1', height: '400px' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Динамика продаж (по месяцам)</h3>
          <div style={{ height: '320px' }}>
            {filteredMonthly.length > 0 ? (
              <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Нет данных за период</div>
            )}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Топ-5 Клиентов (VIP)</h3>
          <div style={{ height: '250px' }}>
            {filteredClients.length > 0 ? (
              <Bar data={clientsChartData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Нет данных за период</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Эффективность менеджеров</h3>
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            {Object.keys(managerTotals).length > 0 ? (
              <Doughnut data={managerChartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Нет данных за период</div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Доля продуктов</h3>
          <div style={{ height: '250px', display: 'flex', justifyContent: 'center' }}>
            {Object.keys(productTotals).length > 0 ? (
              <Doughnut data={productChartData} options={{ maintainAspectRatio: false }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Нет данных за период</div>
            )}
          </div>
        </div>
        
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Статусы заказов (Воронка производства)</h3>
          <div style={{ height: '250px' }}>
            {Object.values(statusTotals).some(v => v > 0) ? (
              <Bar data={statusChartData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Нет данных за период</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
