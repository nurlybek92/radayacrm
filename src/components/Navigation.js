'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Factory, LogOut, User, Package } from 'lucide-react';

export default function Navigation({ session }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    }
  };

  const isDirector = session.role === 'director';
  const isSales = session.role === 'sales' || session.role === 'director';
  const isProduction = session.role === 'production' || session.role === 'director';

  return (
    <header className="header-glass">
      <div className="container nav-container">
        <Link href="/" className="logo" style={{ gap: '0.75rem' }}>
          <img src="/logo.jpg" alt="RaDeya Logo" style={{ height: '32px', width: 'auto', borderRadius: '4px' }} />
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem' }}>
            The RaDeyaCRM
          </span>
        </Link>

        <nav className="nav-links">
          {isDirector && (
            <Link
              href="/dashboard"
              className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Дашборд
            </Link>
          )}
          {isSales && (
            <Link
              href="/sales"
              className={`nav-link ${pathname === '/sales' ? 'active' : ''}`}
            >
              <ShoppingCart className="w-4 h-4" />
              Продажи
            </Link>
          )}
          {isProduction && (
            <Link
              href="/production"
              className={`nav-link ${pathname === '/production' ? 'active' : ''}`}
            >
              <Factory className="w-4 h-4" />
              Производство
            </Link>
          )}
          {isProduction && (
            <Link
              href="/warehouse"
              className={`nav-link ${pathname === '/warehouse' ? 'active' : ''}`}
            >
              <Package className="w-4 h-4" />
              Склад
            </Link>
          )}
        </nav>

        <div className="user-badge">
          <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{session.name}</span>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--primary)',
            background: 'var(--primary-glow)',
            padding: '0.15rem 0.5rem',
            borderRadius: '9999px',
            fontWeight: 600
          }}>
            {session.role === 'director' ? 'Директор' : 
             session.role === 'production' ? 'Производство' : 'Продажи'}
          </span>
          <button onClick={handleLogout} className="logout-btn" title="Выйти">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
