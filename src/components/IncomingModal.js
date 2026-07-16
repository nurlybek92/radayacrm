'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, PlusCircle } from 'lucide-react';

export default function IncomingModal({ isOpen, onClose, materials }) {
  const [materialId, setMaterialId] = useState('');
  const [amountKg, setAmountKg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  if (!isOpen) return null;

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
          action: 'add_incoming',
          materialId,
          amountKg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Приход оформлен успешно!');
        setAmountKg('');
        router.refresh();
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 1200);
      } else {
        setError(data.error || 'Произошла ошибка при оформлении.');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', background: '#0e1322', position: 'relative' }}>
        <button onClick={onClose} style={{
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

        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          Оформить приход сырья
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
          <div className="form-group">
            <label className="form-label">Выберите сырье</label>
            <select
              className="form-input"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              required
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
              <option value="" disabled>-- Выберите сырье --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#111827' }}>
                  {m.name} (остаток: {m.stock_kg} кг)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Принятый объем (кг)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              placeholder="Например: 500"
              value={amountKg}
              onChange={(e) => setAmountKg(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Сохранение...' : 'Оформить приход'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
