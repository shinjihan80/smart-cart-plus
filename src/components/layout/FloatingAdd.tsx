'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import TextImportModal from '@/components/TextImportModal';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export default function FloatingAdd() {
  const { addItems } = useCart();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <>
      <button
        aria-label="상품 추가"
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30 hover:scale-105 active:scale-95 transition-transform"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={(newItems) => {
            const { added, skipped } = addItems(newItems);
            if (skipped > 0) {
              showToast(`${added}개 추가 (${skipped}개 중복 건너뜀)`);
            } else {
              showToast(`${added}개 상품이 추가됐어요!`);
            }
          }}
        />
      )}
    </>
  );
}
