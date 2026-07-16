'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Factory, Package, Send, Calendar, LayoutGrid } from 'lucide-react';

export function ProductionClient({ orders, session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'calendar'

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

  const updatePlanDate = async (order_id, date_str) => {
    setLoading(true);
    await fetch('/api/production/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id, planned_date: date_str })
    });
    setLoading(false);
    router.refresh();
  };

  const columns = [
    { id: 'RECEIVED', title: 'Получен (Новые)', icon: <Package className="w-5 h-5 text-gray-500" />, next: 'CAST', nextLabel: 'В отливку' },
    { id: 'CAST', title: 'В производстве (Отлит)', icon: <Factory className="w-5 h-5 text-yellow-500" />, next: 'READY', nextLabel: 'Готов' },
    { id: 'READY', title: 'Готов на складе', icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />, next: 'SHIPPED', nextLabel: 'Отгрузить' },
    { id: 'SHIPPED', title: 'Отгружен', icon: <Send className="w-5 h-5 text-green-500" />, next: null }
  ];

  // Calendar logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate next 7 days for the calendar view
  const calendarDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    calendarDays.push(d);
  }

  const getOrdersForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return orders.filter(o => o.planned_date && o.planned_date.startsWith(dateStr) && o.current_status !== 'SHIPPED');
  };

  const unscheduledOrders = orders.filter(o => !o.planned_date && o.current_status !== 'SHIPPED');

  const renderOrderCard = (order, colNext, colNextLabel) => (
    <div key={order.id} className="card" style={{ padding: '1rem', background: '#FFF', borderLeft: order.planned_date ? '4px solid var(--primary)' : '4px solid #ccc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>#{order.id} — {new Date(order.order_date).toLocaleDateString('ru-RU')}</div>
        {viewMode === 'kanban' && (
          <input 
            type="date" 
            title="Запланированная дата"
            style={{ fontSize: '0.7rem', padding: '0.1rem', border: '1px solid #ddd', borderRadius: '4px' }}
            value={order.planned_date ? order.planned_date.split('T')[0] : ''}
            onChange={(e) => updatePlanDate(order.id, e.target.value)}
          />
        )}
      </div>
      <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{order.client_name}</div>
      <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        <span className="badge badge-gray">{order.product_type}</span> {order.product_name}<br/>
        Кол-во: <strong>{order.quantity.toLocaleString('ru-RU')}</strong> | Вес: <strong>{order.total_weight} кг</strong>
      </div>
      
      {colNext && (
        <button 
          className="btn btn-success" 
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
          disabled={loading || (colNext === 'SHIPPED' && session.role === 'production')}
          title={colNext === 'SHIPPED' && session.role === 'production' ? 'Отгружать может только менеджер продаж' : ''}
          onClick={() => updateStatus(order.id, colNext)}
        >
          {colNextLabel} ➔
        </button>
      )}
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Производство</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Управление заказами и планирование выпуска</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F8F9FA', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4" /> Канбан
          </button>
          <button 
            className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem' }}
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="w-4 h-4" /> Планинг
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {columns.map(col => (
            <div key={col.id} className="card" style={{ background: '#F8F9FA', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {col.icon}
                <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{col.title}</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.filter(o => o.current_status === col.id).map(order => renderOrderCard(order, col.next, col.nextLabel))}
                {orders.filter(o => o.current_status === col.id).length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>Нет заказов</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {/* Unscheduled Orders */}
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Нераспределенные заказы (Требуют планирования)</h3>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              {unscheduledOrders.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Все активные заказы распределены по датам.</div>
              ) : (
                unscheduledOrders.map(order => (
                  <div key={order.id} style={{ minWidth: '250px' }}>
                    {renderOrderCard(order, null, null)}
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Назначить дату:</label>
                      <input 
                        type="date" 
                        className="form-input"
                        style={{ padding: '0.25rem' }}
                        onChange={(e) => updatePlanDate(order.id, e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 7-Day Calendar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', alignItems: 'start' }}>
            {calendarDays.map((date, idx) => {
              const dayOrders = getOrdersForDate(date);
              const isToday = idx === 0;
              const dateStr = date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
              
              return (
                <div key={date.toISOString()} className="card" style={{ background: isToday ? 'var(--primary-glow)' : '#F8F9FA', padding: '1rem', border: isToday ? '1px solid var(--primary)' : 'none' }}>
                  <div style={{ textAlign: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>
                    <h4 style={{ margin: 0, color: isToday ? 'var(--primary)' : 'var(--text-primary)', fontWeight: 800 }}>{dateStr}</h4>
                    {isToday && <span className="badge badge-blue" style={{ fontSize: '0.6rem', marginTop: '0.25rem' }}>Сегодня</span>}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {dayOrders.map(order => {
                      const colNext = columns.find(c => c.id === order.current_status)?.next;
                      const colNextLabel = columns.find(c => c.id === order.current_status)?.nextLabel;
                      return (
                        <div key={order.id}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                            Статус: {columns.find(c => c.id === order.current_status)?.title}
                          </div>
                          {renderOrderCard(order, colNext, colNextLabel)}
                        </div>
                      );
                    })}
                    {dayOrders.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '1rem 0' }}>Свободно</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
