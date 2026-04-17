'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import TextImportModal from '@/components/TextImportModal';
import { useCart } from '@/context/CartContext';

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

export default function FloatingAdd() {
  const { addItems } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      {/* FAB */}
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

      {/* 모달 */}
      {showModal && (
        <TextImportModal
          onClose={() => setShowModal(false)}
          onImport={(newItems) => {
            addItems(newItems);
            showToast(`${newItems.length}개 상품이 추가됐어요!`);
          }}
        />
      )}

      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
          >
            <div className="rounded-2xl bg-gray-900 text-white text-sm font-medium px-4 py-3 text-center shadow-lg">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
