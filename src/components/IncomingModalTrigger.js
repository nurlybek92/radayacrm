'use client';

import { useState } from 'react';
import IncomingModal from './IncomingModal';
import { Plus } from 'lucide-react';

export default function IncomingModalTrigger({ materials }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-success"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Plus className="w-5 h-5" />
        Оформить приход сырья
      </button>

      <IncomingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        materials={materials}
      />
    </>
  );
}
