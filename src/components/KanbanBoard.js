'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Calendar, Phone, User, X, AlertCircle } from 'lucide-react';

const COLUMNS = {
  new: { title: 'Новые заявки', color: 'badge-blue' },
  calc: { title: 'Расчет / Согласование', color: 'badge-purple' },
  production: { title: 'В производстве', color: 'badge-yellow' },
  done: { title: 'Отгружено', color: 'badge-green' }
};

export default function KanbanBoard({ initialDeals, session, managers }) {
  const [deals, setDeals] = useState(initialDeals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [volumeRequested, setVolumeRequested] = useState('');
  const [amount, setAmount] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [managerId, setManagerId] = useState(session.id.toString());

  const router = useRouter();
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const dealId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(dealId)) return;

    // Find the deal
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.status === targetStatus) return;

    // Check authorization: manager can only update their own, director/accountant can update all
    const isAuthorized = session.role === 'director' || session.role === 'accountant' || session.id === deal.manager_id;
    if (!isAuthorized) {
      alert('У вас нет прав для изменения этой сделки');
      return;
    }

    // Optimistically update status locally
    const originalDeals = [...deals];
    setDeals(deals.map(d => d.id === dealId ? { ...d, status: targetStatus } : d));

    try {
      const res = await fetch('/api/deals/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, newStatus: targetStatus })
      });

      if (!res.ok) {
        throw new Error('Failed to update');
      }
      router.refresh();
    } catch (err) {
      // Revert on error
      setDeals(originalDeals);
      alert('Ошибка при изменении статуса сделки.');
    }
  };

  const handleDelete = async (dealId) => {
    if (!confirm('Вы уверены, что хотите безвозвратно удалить сделку?')) return;

    try {
      const res = await fetch(`/api/deals?id=${dealId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDeals(deals.filter(d => d.id !== dealId));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка при удалении сделки.');
      }
    } catch (err) {
      alert('Не удалось подключиться к серверу.');
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          phone,
          volumeRequested: volumeRequested || 0,
          amount,
          deadlineDate,
          managerId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Reset form
        setClientName('');
        setPhone('');
        setVolumeRequested('');
        setAmount('');
        setDeadlineDate('');
        setIsModalOpen(false);
        
        // Refresh page data
        router.refresh();
        window.location.reload();
      } else {
        setError(data.error || 'Не удалось создать сделку.');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
    }
  };

  // Group deals by status
  const groupedDeals = { new: [], calc: [], production: [], done: [] };
  deals.forEach(deal => {
    if (groupedDeals[deal.status] !== undefined) {
      groupedDeals[deal.status].push(deal);
    }
  });

  const formatNum = (val) => new Intl.NumberFormat('ru-RU').format(val);
  const isDirectorOrSales = session.role === 'director' || session.role === 'sales';

  return (
    <>
      {/* Top Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
            Продажи (Канбан-доска)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {session.role === 'sales' ? 'Вы видите только свои сделки.' : 'Вы видите все сделки всех менеджеров.'}
          </p>
        </div>
        {isDirectorOrSales && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Новая сделка
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        alignItems: 'stretch',
        minHeight: '65vh'
      }}>
        {Object.entries(COLUMNS).map(([statusKey, col]) => {
          const colDeals = groupedDeals[statusKey];
          return (
            <div
              key={statusKey}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusKey)}
              style={{
                background: 'rgba(17, 24, 43, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Column Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem'
              }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{col.title}</h3>
                <span className={`badge ${col.color}`}>{colDeals.length}</span>
              </div>

              {/* Cards Container */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                flexGrow: 1,
                overflowY: 'auto',
                paddingRight: '2px'
              }}>
                {colDeals.map((deal) => {
                  const isOverdue = deal.deadline_date && deal.deadline_date < todayStr && statusKey !== 'done';
                  const isToday = deal.deadline_date && deal.deadline_date === todayStr && statusKey !== 'done';
                  const canDelete = session.role === 'director' || session.id === deal.manager_id;

                  let cardBorderColor = 'var(--border-color)';
                  if (isOverdue) cardBorderColor = 'rgba(239, 68, 68, 0.5)';
                  else if (isToday) cardBorderColor = 'rgba(245, 158, 11, 0.5)';

                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      style={{
                        background: 'var(--bg-card)',
                        border: `1px solid ${cardBorderColor}`,
                        borderRadius: '0.85rem',
                        padding: '1.1rem',
                        cursor: 'grab',
                        position: 'relative',
                        transition: 'var(--transition)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      className="kanban-card-hover"
                    >
                      {/* Delete button */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(deal.id)}
                          style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Client info */}
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, paddingRight: '1.5rem', marginBottom: '0.5rem' }}>
                        {deal.client_name}
                      </h4>

                      {deal.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                          <Phone className="w-3.5 h-3.5" />
                          <span>{deal.phone}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                        <User className="w-3.5 h-3.5" />
                        <span>Менеджер: {deal.manager_name}</span>
                      </div>

                      {/* Volume and price */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '0.75rem',
                        marginTop: '0.75rem'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Тираж: <strong style={{ color: 'var(--text-primary)' }}>{formatNum(deal.volume_requested)} шт</strong>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatNum(deal.amount)} ₸
                        </div>
                      </div>

                      {/* Deadline label */}
                      {deal.deadline_date && (
                        <div style={{
                          marginTop: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: isOverdue ? 'rgba(239, 68, 68, 0.1)' : isToday ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          color: isOverdue ? '#f87171' : isToday ? '#fbbf24' : 'var(--text-secondary)'
                        }}>
                          <Calendar className="w-3 h-3" />
                          <span>Срок: {new Date(deal.deadline_date).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {colDeals.length === 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.75rem'
                  }}>
                    Колонка пуста
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', background: '#0e1322', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}>
              <X className="w-5 h-5" />
            </button>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              Добавить новую сделку
            </h2>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateDeal}>
              <div className="form-group">
                <label className="form-label">Клиент (ФИО / Компания) *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ИП Иванов"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Телефон</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+7 (707) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Тираж (шт)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="25000"
                    value={volumeRequested}
                    onChange={(e) => setVolumeRequested(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Сумма сделки (₸) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="120000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Срок выполнения (дедлайн)</label>
                <input
                  type="date"
                  className="form-input"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              {session.role === 'director' && (
                <div className="form-group">
                  <label className="form-label">Назначить менеджера</label>
                  <select
                    className="form-input"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    disabled={loading}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%239ca3af\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.25rem',
                      paddingRight: '2rem'
                    }}
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id} style={{ background: '#111827' }}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Создание...' : 'Создать сделку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
