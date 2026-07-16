import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#0a1118', /* dark background like the screenshot */
      color: '#ffffff',
      padding: '2rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
      borderTop: '1px solid #1f2937'
    }}>
      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/logoNZ.png" 
          alt="NZ AGENCY Logo" 
          style={{ height: '60px', width: 'auto', marginBottom: '0.25rem' }} 
        />
      </div>
      <div style={{ 
        color: '#d97706', /* slightly orange/muted */
        fontSize: '0.9rem', 
        fontWeight: '500' 
      }}>
        © 2026 NZ Agency. Все права защищены.
      </div>
    </footer>
  );
}
