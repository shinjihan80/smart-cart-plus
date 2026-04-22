'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="맨 위로"
      className="fixed bottom-28 right-5 z-30 w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shadow-lg hover:text-brand-primary hover:border-brand-primary/30 active:scale-95 transition-all"
    >
      <ArrowUp size={20} strokeWidth={2.2} />
    </button>
  );
}
