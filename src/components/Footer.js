import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#003D7A', /* dark blue */
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
        color: '#E6E7E8', /* light gray */
        fontSize: '0.9rem', 
        fontWeight: '500' 
      }}>
        © 2026 NZ Agency. Все права защищены.
      </div>
    </footer>
  );
}
