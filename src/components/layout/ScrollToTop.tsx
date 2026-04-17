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
      className="fixed bottom-24 left-5 z-30 w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 flex items-center justify-center shadow-md hover:text-gray-600 hover:scale-105 active:scale-95 transition-all"
    >
      <ArrowUp size={16} />
    </button>
  );
}
