'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus } from 'lucide-react';

export function WarehouseClient({ materials, transactions, session }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ material_id: materials[0]?.id || 1, weight: '' });

  const handleIncome = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    await fetch('/api/warehouse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    setForm({ ...form, weight: '' });
    setShowModal(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Склад сырья</h1>
        {(session.role === 'director' || session.role === 'production') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Оприходовать сырье
          </button>
        )}
      </div>

      {/* Stock Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {materials.map(mat => {
          const isRedline = mat.stock < mat.critical_limit;
          return (
            <div key={mat.id} className="card" style={{ borderTop: isRedline ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{mat.name} ({mat.type})</h3>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: isRedline ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {mat.stock.toLocaleString('ru-RU')} кг
                  </h2>
                  {isRedline && (
                    <span className="badge badge-red" style={{ marginTop: '0.5rem' }}>Требуется закуп! (Ниже {mat.critical_limit} кг)</span>
                  )}
                  {!isRedline && (
                    <span className="badge badge-green" style={{ marginTop: '0.5rem' }}>В норме</span>
                  )}
                </div>
                <div style={{ padding: '1rem', background: isRedline ? 'var(--danger-glow)' : 'var(--primary-glow)', color: isRedline ? 'var(--danger)' : 'var(--primary)', borderRadius: '1rem' }}>
                  <Package className="w-8 h-8" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>История транзакций</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Сырье</th>
                <th>Тип операции</th>
                <th>Вес (кг)</th>
                <th>Сотрудник</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleString('ru-RU')}</td>
                  <td style={{ fontWeight: 600 }}>{t.material_name}</td>
                  <td>
                    {t.transaction_type === 'INCOME' && <span className="badge badge-green">Приход</span>}
                    {t.transaction_type === 'RESERVE' && <span className="badge badge-blue">Резерв под заказ</span>}
                    {t.transaction_type === 'ADJUSTMENT' && <span className="badge badge-gray">Корректировка</span>}
                  </td>
                  <td style={{ color: t.weight > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {t.weight > 0 ? '+' : ''}{t.weight} кг
                  </td>
                  <td>{t.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Поступление сырья</h3>
            <form onSubmit={handleIncome}>
              <div className="form-group">
                <label className="form-label">Тип сырья</label>
                <select 
                  className="form-input" 
                  value={form.material_id} 
                  onChange={e => setForm({...form, material_id: parseInt(e.target.value)})}
                >
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Вес поступления (кг)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  required 
                  value={form.weight} 
                  onChange={e => setForm({...form, weight: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
