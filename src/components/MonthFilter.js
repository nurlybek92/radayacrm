'use client';

import { useRouter } from 'next/navigation';

export default function MonthFilter({ currentMonth, distinctMonths }) {
  const router = useRouter();

  const handleChange = (e) => {
    const val = e.target.value;
    if (val) {
      router.push(`/dashboard?month=${val}`);
    } else {
      router.push('/dashboard');
    }
  };

  const formatMonth = (yyyy_mm) => {
    if (!yyyy_mm) return '';
    const [year, month] = yyyy_mm.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <select 
        className="form-input" 
        style={{ padding: '0.4rem 0.75rem', width: 'auto', minWidth: '150px' }}
        value={currentMonth}
        onChange={handleChange}
      >
        <option value="all">За всё время</option>
        {distinctMonths.map(m => (
          <option key={m} value={m}>{formatMonth(m)}</option>
        ))}
      </select>
    </div>
  );
}
