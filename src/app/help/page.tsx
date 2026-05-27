'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown,
  Smartphone, Refrigerator, Shirt, BarChart3,
  Sparkles, Bell, HardDrive, HelpCircle, Mail,
  type LucideIcon,
} from 'lucide-react';

/**
 * NEMOA 도움말 — 카드사 앱 스타일.
 * 첫 진입 시 메뉴 1줄만 노출. 클릭 시 펼침(아코디언).
 */

const CARD_SHADOW = {
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 8px -4px rgba(31, 31, 46, 0.04)',
};

interface MenuRowProps {
  Icon:        LucideIcon;
  title:       string;
  summary:     string;
  open:        boolean;
  onToggle:    () => void;
  children:    React.ReactNode;
}

function MenuRow({ Icon, title, summary, open, onToggle, children }: MenuRowProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={CARD_SHADOW}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
        aria-expanded={open}
      >
        <span className="shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
          <Icon size={16} strokeWidth={2} className="text-gray-600" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{summary}</p>
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-300 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-50 text-sm text-gray-600 leading-relaxed flex flex-col gap-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-gray-300 mt-0.5 shrink-0">·</span>
      <span className="flex-1 text-gray-600">{children}</span>
    </div>
  );
}

interface FaqItem { q: string; a: string }
const FAQS: FaqItem[] = [
  { q: '데이터는 어디에 저장되나요?',          a: '내 휴대폰에만 저장. 서버 미사용. 백업 파일로 다른 기기 이전.' },
  { q: 'AI 사용량 한도는?',                    a: '무료 일일 한도 — 사진 10회 / 텍스트 20회 / URL 5회. 자정 자동 리셋.' },
  { q: '실수로 삭제했어요',                    a: '하단 "되돌리기" 버튼이 다음 행동까지 유지. 천천히 누르셔도 됩니다.' },
  { q: '카드 디자인이 안 보여요',              a: '브라우저 새로고침. PWA는 앱 종료 후 재실행.' },
  { q: '알림이 안 와요',                       a: '설정 → 알림 설정 + 브라우저 알림 권한 허용.' },
  { q: '가족과 함께 쓸 수 있나요?',            a: '설정 → 프로필 추가. 등록 시 누구 것인지 선택.' },
  { q: '오프라인에서도 쓸 수 있나요?',         a: 'PWA 설치 시 비행기 모드에서도 기본 기능 작동. AI만 인터넷 필요.' },
];

export default function HelpPage() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="뒤로"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">도움말</h1>
            <p className="text-sm text-gray-400 mt-0.5">항목을 탭해 자세히 보기</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-2 pb-12">

        <MenuRow
          Icon={Smartphone}
          title="시작하기"
          summary="홈 화면에 앱처럼 추가"
          open={openId === 'start'}
          onToggle={() => toggle('start')}
        >
          <Bullet><strong>iOS Safari</strong> · 공유 → 홈 화면에 추가</Bullet>
          <Bullet><strong>Android Chrome</strong> · 메뉴 → 앱 설치</Bullet>
          <Bullet>홈 화면 아이콘 · 풀스크린 · 오프라인 작동</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Refrigerator}
          title="냉장고"
          summary="식품 등록 · 임박 알림 · 보관별 필터"
          open={openId === 'fridge'}
          onToggle={() => toggle('fridge')}
        >
          <Bullet>상단 임박 위젯 — D-2 이내 식품 강조</Bullet>
          <Bullet>보관별 필터 — 전체 / 냉장 / 냉동 / 실온</Bullet>
          <Bullet>카드 탭 → 펼침 → 🗑 삭제 버튼</Bullet>
          <Bullet>다른 카드 탭 시 이전 카드 자동 닫힘</Bullet>
          <Bullet>레시피 자동 추천 (보관 식품 기반)</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Shirt}
          title="옷장"
          summary="코디 추천 · 사이즈 매칭 · 계절 보관"
          open={openId === 'closet'}
          onToggle={() => toggle('closet')}
        >
          <Bullet>오늘의 코디 — 날씨 기반 자동 추천</Bullet>
          <Bullet>코디 모달 → 누끼 그리드 → 일괄 &ldquo;오늘 입기&rdquo;</Bullet>
          <Bullet>정렬 — 이름 / 두께 / 어울림 / 사이즈 / 빈도</Bullet>
          <Bullet>사이즈 매칭 칩 — 키·체중 입력 후 활성</Bullet>
          <Bullet>계절 보관 — 비시즌 옷 일괄 보관</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Sparkles}
          title="AI 자동 등록"
          summary="사진 · 텍스트 · URL 한 번에 인식"
          open={openId === 'ai'}
          onToggle={() => toggle('ai')}
        >
          <Bullet>📷 사진 — 라벨·사이즈표 캡처 자동 추출</Bullet>
          <Bullet>📝 텍스트 — 영수증·이메일 붙여넣기</Bullet>
          <Bullet>🔗 URL — 쇼핑몰 상품 페이지 주소 입력</Bullet>
          <Bullet>결과 확인 후 [수정] 또는 [등록 완료]</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Bell}
          title="알림"
          summary="유통기한 · 날씨 자동 안내"
          open={openId === 'notify'}
          onToggle={() => toggle('notify')}
        >
          <Bullet>1단계 (D-Day · 기상 이변) — 오전 발송</Bullet>
          <Bullet>2단계 (D-1 · 내일 코디) — 저녁 발송</Bullet>
          <Bullet>3단계 (D-3 안내) — 오전 10시</Bullet>
          <Bullet>설정 → 알림 미리보기로 디자인 확인</Bullet>
        </MenuRow>

        <MenuRow
          Icon={BarChart3}
          title="마이"
          summary="통계 · 영양 · 지출 · 재구매 주기"
          open={openId === 'mypage'}
          onToggle={() => toggle('mypage')}
        >
          <Bullet>영양 위젯 — 보관 식품 vs 일일 목표</Bullet>
          <Bullet>월별 지출 추이</Bullet>
          <Bullet>자주 구매하는 재료 + 재구매 주기</Bullet>
          <Bullet>옷장 정리 추천 (6개월+ 미착용)</Bullet>
        </MenuRow>

        <MenuRow
          Icon={HardDrive}
          title="데이터"
          summary="백업 · 복원 · 초기화"
          open={openId === 'data'}
          onToggle={() => toggle('data')}
        >
          <Bullet>지금 백업하기 — 전체 JSON</Bullet>
          <Bullet>경량 백업 — 이미지 제외</Bullet>
          <Bullet>백업에서 복원 — 다른 기기 이전</Bullet>
          <Bullet>전체 초기화 — 백업 후 진행 권장</Bullet>
        </MenuRow>

        <MenuRow
          Icon={HelpCircle}
          title="자주 묻는 질문"
          summary={`${FAQS.length}개 항목`}
          open={openId === 'faq'}
          onToggle={() => toggle('faq')}
        >
          <div className="-mx-1 -my-2">
            {FAQS.map((item, i) => (
              <div key={i} className="border-b border-gray-100 last:border-0 py-2">
                <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </MenuRow>

        <MenuRow
          Icon={Mail}
          title="문의"
          summary="버그 · 개선 의견"
          open={openId === 'contact'}
          onToggle={() => toggle('contact')}
        >
          <Bullet>설정 → 오류 기록 복사하기</Bullet>
          <Bullet>복사한 로그 + 메시지를 함께 전달</Bullet>
          <Bullet>Pro 단계에서 카카오 채널 등 정식 문의 채널 안내</Bullet>
        </MenuRow>

        <p className="text-center text-xs text-gray-400 mt-4">
          NEMOA · 데이터는 휴대폰에만
        </p>

      </div>
    </div>
  );
}
