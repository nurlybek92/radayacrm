'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function FunnelChart({ data }) {
  const chartData = {
    labels: ['Новые', 'Расчет', 'В производстве', 'Отгружено'],
    datasets: [
      {
        label: 'Количество сделок',
        data: [data.new || 0, data.calc || 0, data.production || 0, data.done || 0],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',  // Indigo
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(245, 158, 11, 0.8)',  // Yellow
          'rgba(16, 185, 129, 0.8)',  // Green
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 12,
        cornerRadius: 8,
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9ca3af', precision: 0 },
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
