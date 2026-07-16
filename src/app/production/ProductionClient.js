'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Factory, Package, Send } from 'lucide-react';

export function ProductionClient({ orders, session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (order_id, new_status) => {
    setLoading(true);
    await fetch('/api/production/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id, status: new_status })
    });
    setLoading(false);
    router.refresh();
  };

  const columns = [
    { id: 'RECEIVED', title: 'Получен', icon: <Package className="w-5 h-5 text-gray-500" />, next: 'CAST', nextLabel: 'В отливку' },
    { id: 'CAST', title: 'В производстве (Отлит)', icon: <Factory className="w-5 h-5 text-yellow-500" />, next: 'READY', nextLabel: 'Готов' },
    { id: 'READY', title: 'Готов на складе', icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />, next: 'SHIPPED', nextLabel: 'Отгрузить' },
    { id: 'SHIPPED', title: 'Отгружен', icon: <Send className="w-5 h-5 text-green-500" />, next: null }
  ];

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Производственный Канбан</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Переводите заказы по этапам (зеленить статусы)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
        {columns.map(col => (
          <div key={col.id} className="card" style={{ background: '#F8F9FA', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {col.icon}
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{col.title}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.filter(o => o.current_status === col.id).map(order => (
                <div key={order.id} className="card" style={{ padding: '1rem', background: '#FFF' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>#{order.id} — {new Date(order.order_date).toLocaleDateString('ru-RU')}</div>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{order.client_name}</div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <span className="badge badge-gray">{order.product_type}</span> {order.product_name}<br/>
                    Кол-во: <strong>{order.quantity.toLocaleString('ru-RU')}</strong> | Вес: <strong>{order.total_weight} кг</strong>
                  </div>
                  
                  {col.next && (
                    <button 
                      className="btn btn-success" 
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                      disabled={loading || (col.next === 'SHIPPED' && session.role === 'production')}
                      title={col.next === 'SHIPPED' && session.role === 'production' ? 'Отгружать может только менеджер продаж' : ''}
                      onClick={() => updateStatus(order.id, col.next)}
                    >
                      {col.nextLabel} ➔
                    </button>
                  )}
                </div>
              ))}
              {orders.filter(o => o.current_status === col.id).length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>Нет заказов</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
