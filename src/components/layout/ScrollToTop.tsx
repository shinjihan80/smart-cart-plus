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
      // 흰 원 + shadow-lg만으로는 흰 카드 위에서 경계가 거의 안 보여 실제
      // 콘텐츠(설정 토글, 카드 모서리)를 가려도 눈에 안 띄었다(검토단 C6,
      // 여러 라운드 연속 지적). 테두리를 더 진하게 + 그림자를 카드보다
      // 뚜렷하게 키워 "떠 있는 컨트롤"이라는 게 흰 배경 위에서도 보이게 한다.
      className="fixed bottom-28 right-5 z-30 w-12 h-12 rounded-full bg-white border-2 border-gray-300 text-gray-600 flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(0,0,0,0.25)] hover:text-brand-primary hover:border-brand-primary/40 active:scale-95 transition-all"
    >
      <ArrowUp size={20} strokeWidth={2.2} />
    </button>
  );
}
