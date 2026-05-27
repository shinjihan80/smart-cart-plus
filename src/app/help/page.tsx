'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown,
  Smartphone, Refrigerator, Shirt, BarChart3,
  Sparkles, Bell, HardDrive, HelpCircle, Mail, Store,
  type LucideIcon,
} from 'lucide-react';

const CARD_SHADOW = {
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 8px -4px rgba(31, 31, 46, 0.04)',
};

interface MenuRowProps {
  Icon:     LucideIcon;
  title:    string;
  summary:  string;
  open:     boolean;
  onToggle: () => void;
  children: React.ReactNode;
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
  { q: '데이터는 어디에 저장되나요?',
    a: '내 휴대폰에만 저장됩니다. 서버로 전송되지 않으며, 백업 파일로 다른 기기로 이전할 수 있어요.' },
  { q: 'AI 사용 한도는 하루에 얼마나 되나요?',
    a: '무료 기준 하루 한도 — 사진 분석 5회 / 텍스트 파싱 10회 / 영양 분석 2회 / URL 분석 2회 / 보관 위치 추천 5회. 자정에 자동 초기화됩니다.' },
  { q: '실수로 아이템을 삭제했어요',
    a: '카드를 펼쳐 삭제하면 하단에 "되돌리기" 버튼이 나타납니다. 다음 행동 전까지 눌러서 복구할 수 있어요.' },
  { q: '알림이 오지 않아요',
    a: '설정 → 알림 설정에서 켜져 있는지 확인하고, 브라우저(또는 앱) 알림 권한도 허용해 주세요.' },
  { q: '가족과 함께 쓸 수 있나요?',
    a: '마이 화면에서 프로필을 추가하면 가족 구성원별로 관리할 수 있습니다. "교체" 버튼으로 현재 사용자를 바꿀 수 있어요.' },
  { q: '오프라인에서도 사용할 수 있나요?',
    a: 'PWA로 설치하면 인터넷 없이도 기본 기능(아이템 보기·메모·정렬)이 작동합니다. AI 분석과 레시피 불러오기는 인터넷이 필요해요.' },
  { q: '냉장고 모델은 어떻게 선택하나요?',
    a: '마이 → 나의 냉장고 섹션에서 양문형·4도어·1도어·김치냉장고 중 하나를 선택하면 칸 구조가 맞춰집니다.' },
  { q: '카드가 제대로 안 보여요',
    a: '브라우저에서 새로고침 해주세요. PWA 앱이라면 완전히 종료 후 다시 실행해 보세요.' },
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
          summary="홈 화면에 앱처럼 추가 · 오프라인 사용"
          open={openId === 'start'}
          onToggle={() => toggle('start')}
        >
          <Bullet><strong>iOS Safari</strong> · 공유 버튼 → 홈 화면에 추가</Bullet>
          <Bullet><strong>Android Chrome</strong> · 메뉴 → 앱 설치</Bullet>
          <Bullet>설치 후 홈 화면 아이콘으로 풀스크린 · 오프라인 실행</Bullet>
          <Bullet>홈 상단 배너 "네모아의 오늘 한 마디" — 날씨·계절·임박 상황에 맞는 큐레이션 메시지</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Refrigerator}
          title="냉장고"
          summary="식품 등록 · 임박 알림 · 레시피 추천 · 보관 위치"
          open={openId === 'fridge'}
          onToggle={() => toggle('fridge')}
        >
          <Bullet><strong>3탭 구조</strong> — 🧊냉장고 (목록) / 💡추천 (레시피) / 🛒장보기 (쇼핑 리스트)</Bullet>
          <Bullet>임박 위젯 — D-2 이내 식품 상단 강조 표시</Bullet>
          <Bullet>보관별 필터 — 냉장 / 냉동 / 실온</Bullet>
          <Bullet>카드 탭 → 펼침 → 🗑 삭제 (한 번에 하나씩 열림)</Bullet>
          <Bullet>AI 보관 위치 추천 — 등록 시 냉장고 어느 칸에 넣을지 자동 제안</Bullet>
          <Bullet>레시피 탭 — 보관 식품 기반 24종 추천 · 상세 모달 · 타이머</Bullet>
          <Bullet>즐겨찾기 레시피 · "오늘 뭐 먹지?" 랜덤 추천</Bullet>
          <Bullet>쇼핑 탭 — 소진된 재료 재구매 링크 자동 생성</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Shirt}
          title="옷장"
          summary="코디 추천 · 날씨 매칭 · 처분 도우미"
          open={openId === 'closet'}
          onToggle={() => toggle('closet')}
        >
          <Bullet><strong>3탭 구조</strong> — 👔옷장 (목록) / 👗코디 (추천) / 🛍️쇼핑 (파트너 연결)</Bullet>
          <Bullet>코디 탭 — 날씨·계절 기반 자동 코디 생성 · 2×2 이미지 콜라주</Bullet>
          <Bullet>코디 저장 — ♡ 저장하면 다음번 추천에 더 자주 등장</Bullet>
          <Bullet>정렬 — 이름 / 두께 / 어울림 / 사이즈 / 최근 착용 빈도</Bullet>
          <Bullet>사이즈 매칭 칩 — 마이 → 내 정보에서 키·체중 입력 후 활성</Bullet>
          <Bullet>처분 도우미 — 6개월+ 미착용 옷에 처분 메뉴 표시 (중고·기부·보관)</Bullet>
          <Bullet>계절 보관 — 비시즌 옷 일괄 계절 보관 설정</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Sparkles}
          title="AI 자동 등록"
          summary="사진 · 텍스트 · URL · 영양 분석 · 보관 위치"
          open={openId === 'ai'}
          onToggle={() => toggle('ai')}
        >
          <Bullet>📷 <strong>사진</strong> — 식품 라벨·의류 사이즈표 캡처로 자동 추출</Bullet>
          <Bullet>📝 <strong>텍스트</strong> — 영수증·이메일 내용 붙여넣기</Bullet>
          <Bullet>🔗 <strong>URL</strong> — 쇼핑몰 상품 페이지 주소 입력</Bullet>
          <Bullet>🥗 <strong>영양 분석</strong> — 식품 등록 시 칼로리·단백질·탄수화물 자동 추출</Bullet>
          <Bullet>📦 <strong>보관 위치 추천</strong> — 냉장고 어느 칸에 넣을지 AI 추천</Bullet>
          <Bullet>결과 화면에서 수정 후 [등록 완료] 탭</Bullet>
          <Bullet>무료 일일 한도 — 사진 5 · 텍스트 10 · URL 2 · 영양 2 · 위치 5 (자정 초기화)</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Bell}
          title="알림"
          summary="유통기한 · 재구매 · 시즌 변경 · 날씨"
          open={openId === 'notify'}
          onToggle={() => toggle('notify')}
        >
          <Bullet><strong>홈 배너 알림</strong> — 긴급(D-Day 임박) · 재구매(구매 주기 도래) · 시즌 변경</Bullet>
          <Bullet><strong>D-Day 알림</strong> — 당일 만료 식품 오전 알림</Bullet>
          <Bullet><strong>D-1 알림</strong> — 내일 만료 + 내일 코디 미리보기 저녁 알림</Bullet>
          <Bullet><strong>D-3 안내</strong> — 3일 후 만료 오전 10시 알림</Bullet>
          <Bullet><strong>날씨 알림</strong> — 기상 이변(폭우·한파 등) 감지 시 코디 제안</Bullet>
          <Bullet>설정 → 알림 설정에서 종류별 켜기·끄기 가능</Bullet>
          <Bullet>설정 → 알림 미리보기로 디자인 확인 가능</Bullet>
        </MenuRow>

        <MenuRow
          Icon={Store}
          title="파트너 연결"
          summary="중고 판매 · 기부 · 보관 서비스 바로 연결"
          open={openId === 'partners'}
          onToggle={() => toggle('partners')}
        >
          <Bullet><strong>중고 판매</strong> — 당근마켓·번개장터·KREAM으로 바로 연결 (상품명 자동 검색)</Bullet>
          <Bullet><strong>기부</strong> — 아름다운가게·굿윌스토어·옷캔에 기부 신청 링크</Bullet>
          <Bullet><strong>세탁·보관</strong> — 세탁특공대·다락 보관 서비스 연결</Bullet>
          <Bullet>옷장 → 아이템 펼치기 → 처분 메뉴에서 바로 사용</Bullet>
          <Bullet>총 18개 파트너 서비스 연결 중</Bullet>
        </MenuRow>

        <MenuRow
          Icon={BarChart3}
          title="마이"
          summary="프로필 전환 · 통계 · 연간 활동 · Pro 예고"
          open={openId === 'mypage'}
          onToggle={() => toggle('mypage')}
        >
          <Bullet><strong>사용자 교체</strong> — 상단 "교체" 버튼으로 가족 프로필 간 전환</Bullet>
          <Bullet>영양 위젯 — 보관 식품의 칼로리·영양소 vs 일일 목표</Bullet>
          <Bullet>월별 지출 추이 · 자주 구매하는 재료 + 재구매 주기</Bullet>
          <Bullet><strong>연간 활동</strong> — 조리·착용·소진 12개월 히스토그램 + 연말 페이스 예측</Bullet>
          <Bullet>옷장 정리 추천 — 6개월 이상 미착용 아이템 하이라이트</Bullet>
          <Bullet>Pro 예고 카드 — 베이직 vs Pro 기능 비교 + 출시 알림 신청</Bullet>
        </MenuRow>

        <MenuRow
          Icon={HardDrive}
          title="데이터 관리"
          summary="백업 · 복원 · 내보내기 · 초기화"
          open={openId === 'data'}
          onToggle={() => toggle('data')}
        >
          <Bullet><strong>지금 백업하기</strong> — 전체 데이터(이미지 포함) JSON 저장</Bullet>
          <Bullet><strong>백업에서 복원</strong> — 다른 기기 이전 또는 앱 재설치 후 복구</Bullet>
          <Bullet><strong>JSON 내보내기</strong> — 아이템 목록을 파일로 저장</Bullet>
          <Bullet><strong>CSV 내보내기</strong> — 엑셀 등 스프레드시트에서 열기</Bullet>
          <Bullet>7일 이상 백업 없으면 홈 화면에 알림 배너 표시</Bullet>
          <Bullet>전체 초기화 — 먼저 백업 후 진행 권장 (되돌리기 불가)</Bullet>
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
          <Bullet>설정 → 오류 기록에서 최근 오류를 복사</Bullet>
          <Bullet>복사한 내용 + 상황 설명을 함께 전달해 주시면 빠른 해결에 도움이 됩니다</Bullet>
          <Bullet>Pro 단계에서 카카오 채널 등 정식 문의 채널 안내 예정</Bullet>
        </MenuRow>

        <p className="text-center text-xs text-gray-400 mt-4">
          NEMOA · 데이터는 내 휴대폰에만
        </p>

      </div>
    </div>
  );
}
