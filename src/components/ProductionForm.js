'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';

export default function ProductionForm() {
  const [materialUsed, setMaterialUsed] = useState('');
  const [producedQty, setProducedQty] = useState('');
  const [defectKg, setDefectKg] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_production',
          materialUsed,
          producedQty,
          defectKg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Результаты смены успешно сохранены!');
        setMaterialUsed('');
        setProducedQty('');
        setDefectKg('0');
        router.refresh();
      } else {
        setError(data.error || 'Произошла ошибка при сохранении.');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Package className="w-5 h-5 text-indigo-400" />
        Внести данные по выпуску (Расход сырья)
      </h2>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#34d399',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Израсходовано ПВД (кг) *</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              placeholder="Например: 150"
              value={materialUsed}
              onChange={(e) => setMaterialUsed(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Произведено пакетов (шт) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Например: 25000"
              value={producedQty}
              onChange={(e) => setProducedQty(e.target.value)}
              required
              disabled={loading}
              style={{ fontWeight: 700 }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Брак (кг) <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>(во вторичку)</span></label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              placeholder="0"
              value={defectKg}
              onChange={(e) => setDefectKg(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Сохранение...' : 'Зафиксировать результаты смены'}
        </button>
      </form>
    </div>
  );
}
