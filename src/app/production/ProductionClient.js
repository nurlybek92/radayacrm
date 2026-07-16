'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Factory, Package, Send, Calendar, LayoutGrid, GripVertical } from 'lucide-react';

export function ProductionClient({ orders, session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'calendar'
  const [localOrders, setLocalOrders] = useState(orders);

  const updateStatus = async (order_id, new_status) => {
    setLoading(true);
    // Optimistic update
    setLocalOrders(prev => prev.map(o => o.id === order_id ? { ...o, current_status: new_status } : o));
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
    // Optimistic update
    setLocalOrders(prev => prev.map(o => o.id === order_id ? { ...o, planned_date: date_str ? `${date_str}T00:00:00Z` : null } : o));
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

  // Calendar logic (30 days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const calendarDays = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    calendarDays.push(d);
  }

  // Format date to local YYYY-MM-DD to avoid UTC timezone jumps
  const getLocalDateString = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getOrdersForDate = (date) => {
    const dateStr = getLocalDateString(date);
    return localOrders.filter(o => o.planned_date && o.planned_date.startsWith(dateStr) && o.current_status !== 'SHIPPED');
  };

  const unscheduledOrders = localOrders.filter(o => !o.planned_date && o.current_status !== 'SHIPPED');

  // Drag and drop handlers
  const handleDragStart = (e, order_id) => {
    e.dataTransfer.setData('order_id', order_id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToDate = (e, dateStr) => {
    e.preventDefault();
    const order_id = parseInt(e.dataTransfer.getData('order_id'), 10);
    if (!isNaN(order_id)) {
      updatePlanDate(order_id, dateStr);
    }
  };

  const renderOrderCard = (order, colNext, colNextLabel, draggable = false) => (
    <div 
      key={order.id} 
      className="card" 
      draggable={draggable}
      onDragStart={draggable ? (e) => handleDragStart(e, order.id) : undefined}
      style={{ 
        padding: '1rem', 
        background: '#FFF', 
        borderLeft: order.planned_date ? '4px solid var(--primary)' : '4px solid #ccc',
        minWidth: '250px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: draggable ? 'grab' : 'default',
        boxShadow: draggable ? '0 2px 4px rgba(0,0,0,0.05)' : undefined
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {draggable && <GripVertical className="w-3 h-3" />} #{order.id} — {new Date(order.order_date).toLocaleDateString('ru-RU')}
          </div>
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
      </div>
      
      {colNext && (
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
          <button 
            className="btn btn-success" 
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
            disabled={loading || (colNext === 'SHIPPED' && session.role === 'production')}
            title={colNext === 'SHIPPED' && session.role === 'production' ? 'Отгружать может только менеджер продаж' : ''}
            onClick={() => updateStatus(order.id, colNext)}
          >
            {colNextLabel} ➔
          </button>
        </div>
      )}
      {!colNext && viewMode === 'calendar' && (
         <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Изменить дату:</label>
            <input 
              type="date" 
              className="form-input"
              style={{ padding: '0.4rem', width: '100%', fontSize: '0.8rem' }}
              value={order.planned_date ? order.planned_date.split('T')[0] : ''}
              onChange={(e) => updatePlanDate(order.id, e.target.value)}
            />
         </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '1600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
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
                {localOrders.filter(o => o.current_status === col.id).map(order => renderOrderCard(order, col.next, col.nextLabel))}
                {localOrders.filter(o => o.current_status === col.id).length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0' }}>Нет заказов</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '1rem' }}>
          
          {/* Unscheduled Orders */}
          <div 
            className="card" 
            style={{ borderLeft: '4px solid var(--danger)', padding: '1rem', flexShrink: 0 }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropToDate(e, '')}
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger)', fontSize: '1.1rem' }}>
              Нераспределенные заказы (Перетащите вниз на нужную дату)
            </h3>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {unscheduledOrders.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>Все активные заказы распределены по датам.</div>
              ) : (
                unscheduledOrders.map(order => renderOrderCard(order, null, null, true))
              )}
            </div>
          </div>

          {/* Vertical Calendar */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', paddingBottom: '2rem' }}>
            {calendarDays.map((date, idx) => {
              const dayOrders = getOrdersForDate(date);
              const isToday = idx === 0;
              const dateStrShort = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
              const dateDbStr = getLocalDateString(date);
              
              return (
                <div 
                  key={date.toISOString()} 
                  className="card"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToDate(e, dateDbStr)}
                  style={{ 
                    background: isToday ? 'var(--primary-glow)' : '#F8F9FA', 
                    padding: '1rem', 
                    marginBottom: '1rem',
                    border: isToday ? '1px solid var(--primary)' : '1px dashed var(--border-color)',
                    display: 'flex',
                    alignItems: 'stretch'
                  }}
                >
                  <div style={{ 
                    width: '150px', 
                    borderRight: '2px solid var(--border-color)', 
                    paddingRight: '1rem', 
                    marginRight: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <h4 style={{ margin: 0, color: isToday ? 'var(--primary)' : 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', textTransform: 'capitalize' }}>
                      {dateStrShort}
                    </h4>
                    {isToday && <span className="badge badge-blue" style={{ fontSize: '0.7rem', marginTop: '0.5rem', alignSelf: 'flex-start' }}>Сегодня</span>}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {dayOrders.map(order => renderOrderCard(order, null, null, true))}
                    {dayOrders.length === 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        Перетащите заказы сюда...
                      </div>
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
