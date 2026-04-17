'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import TextImportModal from '@/components/TextImportModal';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

export default function FloatingAdd() {
  const { addItems } = useCart();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...springTransition, delay: 0.5 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="상품 추가"
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg shadow-brand-primary/30"
      >
        <Plus size={24} strokeWidth={2.5} />
      </motion.button>

      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={(newItems) => {
            addItems(newItems);
            showToast(`${newItems.length}개 상품이 추가됐어요!`);
          }}
        />
      )}
    </>
  );
}
