'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ── 섹션 정의 ─────────────────────────────────────────────── */
const SECTIONS = [
  { id: 'overview',  label: '앱 소개' },
  { id: 'start',     label: '시작하기' },
  { id: 'home',      label: '홈 화면' },
  { id: 'fridge',    label: '냉장고' },
  { id: 'closet',    label: '옷장' },
  { id: 'ai',        label: 'AI 자동 등록' },
  { id: 'notify',    label: '알림' },
  { id: 'mypage',    label: '마이페이지' },
  { id: 'settings',  label: '설정' },
  { id: 'faq',       label: '자주 묻는 질문' },
];

/* ── 공통 컴포넌트 ─────────────────────────────────────────── */
function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-gray-900 mb-2 scroll-mt-24">
      {children}
    </h2>
  );
}
function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-3">{children}</h3>;
}
function Divider() {
  return <hr className="border-gray-100 my-10" />;
}
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start mb-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-gray-700 leading-relaxed">{children}</p>
    </div>
  );
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 my-4">
      <span className="text-indigo-500 shrink-0">💡</span>
      <p className="text-sm text-indigo-700 leading-relaxed">{children}</p>
    </div>
  );
}
function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 my-4">
      <span className="shrink-0">⚠️</span>
      <p className="text-sm text-amber-800 leading-relaxed">{children}</p>
    </div>
  );
}

function PhoneFrame({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="relative w-[200px] h-[400px] bg-gray-900 rounded-[28px] shadow-2xl overflow-hidden ring-4 ring-gray-800 shrink-0">
        <Image src={src} alt={alt} fill className="object-cover object-top" />
      </div>
      <figcaption className="text-xs text-gray-400 text-center">{caption}</figcaption>
    </figure>
  );
}

function Row({ screen, children }: { screen: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-10 items-start my-6">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="shrink-0 hidden lg:block">{screen}</div>
    </div>
  );
}

const FAQS = [
  { q: '데이터는 어디에 저장되나요?',
    a: '모든 데이터는 내 휴대폰(브라우저 로컬 저장소)에만 저장됩니다. 서버로 전송되지 않으며, 관리자도 접근할 수 없습니다. 다른 기기로 이전하려면 설정 → 백업 파일을 내보낸 뒤, 새 기기에서 복원하세요.' },
  { q: 'AI 사용량 한도가 뭔가요?',
    a: '무료 플랜 기준 하루 사용 한도입니다. 사진 분석 5회, 텍스트 파싱 10회, 영양 분석 2회, URL 분석 2회, 냉장고 위치 추천 5회. 한도는 매일 자정에 자동으로 초기화됩니다.' },
  { q: '실수로 아이템을 삭제했어요.',
    a: '카드를 펼쳐 🗑 삭제를 누르면 화면 하단에 "되돌리기" 버튼이 잠시 표시됩니다. 다음 행동 전에 눌러서 복구할 수 있어요.' },
  { q: '오프라인에서도 사용할 수 있나요?',
    a: 'PWA로 설치하면 인터넷 없이도 기본 기능(아이템 보기·메모·정렬)이 작동합니다. AI 분석과 레시피 불러오기는 인터넷이 필요합니다.' },
  { q: '알림이 오지 않아요.',
    a: '설정 → 알림 설정에서 원하는 알림이 켜져 있는지 확인하세요. 브라우저(또는 앱) 알림 권한도 허용해야 실제 알림이 도착합니다.' },
  { q: '가족과 함께 쓸 수 있나요?',
    a: '마이 → 사용자 탭에서 "가족·다른 구성원 추가"를 누르면 프로필을 여러 개 만들 수 있습니다. 마이 화면 상단의 "교체" 버튼으로 현재 사용자를 전환합니다.' },
  { q: '냉장고 모델은 어떻게 바꾸나요?',
    a: '마이 → 사용자 탭 → 나의 냉장고 섹션에서 양문형·4도어·1도어·김치냉장고 중 하나를 선택하면 냉장고 칸 구조가 해당 모델에 맞춰집니다.' },
  { q: '앱 아이콘을 홈 화면에 추가하고 싶어요.',
    a: 'iOS Safari: 화면 하단 공유 버튼 → "홈 화면에 추가". Android Chrome: 우측 상단 메뉴(⋮) → "앱 설치". 설치 후에는 일반 앱처럼 아이콘으로 실행됩니다.' },
];

/* ── 메인 페이지 ───────────────────────────────────────────── */
export default function ManualPage() {
  const [activeId, setActiveId] = useState('overview');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const root = document.getElementById('manual-scroll') ?? null;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { root, rootMargin: '-20% 0px -70% 0px' },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'SUIT, Pretendard, -apple-system, sans-serif' }}>

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">N</span>
            <span className="font-bold text-gray-900">NEMOA</span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="text-sm text-gray-500">사용 가이드</span>
          </div>
          <Link href="https://nemoa.vercel.app" target="_blank"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            앱 열기 →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 flex gap-12 pt-10 pb-24">

        {/* 사이드바 */}
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-24">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">목차</p>
            <ul className="space-y-0.5">
              {SECTIONS.map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => {
                      const container = document.getElementById('manual-scroll');
                      const target = document.getElementById(id);
                      if (container && target) {
                        container.scrollTo({ top: target.offsetTop - 96, behavior: 'smooth' });
                      }
                    }}
                    className={`w-full text-left block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeId === id
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 본문 */}
        <main className="flex-1 min-w-0">

          {/* ── 앱 소개 ─────────────────────────────── */}
          <section>
            <div id="overview" className="scroll-mt-24 mb-2">
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-4">NEMOA 가이드</span>
              <h1 className="text-3xl font-black text-gray-900 mb-3">NEMOA 사용 가이드</h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                냉장고·옷장을 AI로 관리하는 라이프스타일 앱 NEMOA의 모든 기능을 설명합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[
                { icon: '🧊', title: '냉장고', desc: '식품 등록·임박 알림·레시피 추천' },
                { icon: '👔', title: '옷장', desc: '의류 관리·날씨 코디·처분 도우미' },
                { icon: '✨', title: 'AI 등록', desc: '사진·텍스트·URL 자동 분석' },
                { icon: '👤', title: '마이', desc: '프로필·통계·연간 활동 기록' },
              ].map((f) => (
                <div key={f.title} className="border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                  <span className="text-2xl">{f.icon}</span>
                  <p className="font-bold text-sm mt-2">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── 시작하기 ─────────────────────────────── */}
          <section>
            <SectionTitle id="start">시작하기</SectionTitle>
            <p className="text-gray-500 mb-6">브라우저에서 바로 사용하거나, 홈 화면에 설치해 앱처럼 쓸 수 있습니다.</p>

            <SubTitle>홈 화면에 앱으로 설치하기 (권장)</SubTitle>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-100 rounded-2xl p-5">
                <p className="font-semibold mb-3 flex items-center gap-2"><span>🍎</span> iOS (Safari)</p>
                <Step n={1}>Safari 주소창에서 <strong>nemoa.vercel.app</strong> 접속</Step>
                <Step n={2}>하단 <strong>공유 버튼</strong>(□↑) 탭</Step>
                <Step n={3}><strong>홈 화면에 추가</strong> 선택 → 추가</Step>
                <Step n={4}>홈 화면 NEMOA 아이콘으로 실행</Step>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5">
                <p className="font-semibold mb-3 flex items-center gap-2"><span>🤖</span> Android (Chrome)</p>
                <Step n={1}>Chrome에서 <strong>nemoa.vercel.app</strong> 접속</Step>
                <Step n={2}>우측 상단 <strong>메뉴(⋮)</strong> 탭</Step>
                <Step n={3}><strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong> 선택</Step>
                <Step n={4}>홈 화면 아이콘으로 실행</Step>
              </div>
            </div>

            <Tip>설치 후에는 오프라인 상태에서도 기본 기능(아이템 목록 보기·메모·정렬)을 사용할 수 있습니다. AI 분석은 인터넷이 필요합니다.</Tip>

            <SubTitle>첫 실행 — 약관 동의</SubTitle>
            <Step n={1}>앱 실행 시 약관·개인정보 처리방침 안내 화면이 나타납니다.</Step>
            <Step n={2}><strong>"동의하고 빈 상태로 시작"</strong>을 탭하면 바로 앱이 열립니다.</Step>
            <Step n={3}>체험 먼저 해보고 싶다면 <strong>"샘플 데이터로 체험해보기"</strong>를 선택하세요.</Step>

            <SubTitle>온보딩 둘러보기</SubTitle>
            <p className="text-gray-600 mb-4">약관 동의 후 앱의 주요 기능을 설명하는 9단계 온보딩이 시작됩니다. <strong>"다음"</strong>을 눌러 순서대로 보거나, <strong>"건너뛰기"</strong>를 탭해 바로 앱을 시작할 수 있습니다.</p>
          </section>

          <Divider />

          {/* ── 홈 화면 ─────────────────────────────── */}
          <section>
            <SectionTitle id="home">홈 화면</SectionTitle>
            <p className="text-gray-500 mb-6">앱의 시작 화면입니다. 오늘의 추천·현황·빠른 이동 메뉴가 한눈에 보입니다.</p>

            <Row screen={
              <PhoneFrame src="/help/screen-home.jpg" alt="홈 화면" caption="홈 화면" />
            }>
              <SubTitle>네모아의 오늘 한 마디</SubTitle>
              <p className="text-gray-600 mb-3">홈 상단 배너에 날씨·계절·임박 식품 상황을 종합한 오늘의 추천 메시지가 표시됩니다. 상황에 따라 9가지 패턴의 메시지가 자동으로 선택됩니다.</p>

              <SubTitle>빠른 이동 메뉴</SubTitle>
              <p className="text-gray-600 mb-3">냉장고·옷장·제철 재료·레시피·쇼핑·활동·프로필·설정 8개 메뉴로 바로 이동합니다. 각 아이콘 위 숫자 뱃지는 해당 섹션의 아이템 수입니다.</p>

              <SubTitle>하단 탭바</SubTitle>
              <p className="text-gray-600 mb-2">화면 하단 4개 탭으로 주요 섹션을 이동합니다.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['🧊 냉장고', '식품 목록·추천·장보기'],
                  ['➕ 등록', 'AI 자동 등록 (메인 기능)'],
                  ['👔 옷장', '의류 목록·코디·쇼핑'],
                  ['👤 마이', '프로필·통계·설정'],
                ].map(([t, d]) => (
                  <div key={t} className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="font-semibold text-xs">{t}</p>
                    <p className="text-gray-500 text-xs">{d}</p>
                  </div>
                ))}
              </div>
            </Row>
          </section>

          <Divider />

          {/* ── 냉장고 ─────────────────────────────── */}
          <section>
            <SectionTitle id="fridge">냉장고</SectionTitle>
            <p className="text-gray-500 mb-6">식품을 보관 위치·유통기한별로 관리하고, 레시피 추천과 장보기 리스트를 한 곳에서 확인합니다.</p>

            <Row screen={
              <PhoneFrame src="/help/screen-fridge.jpg" alt="냉장고 화면" caption="냉장고 — 🧊냉장고 탭" />
            }>
              <SubTitle>3탭 구조</SubTitle>
              <div className="space-y-2 mb-4">
                {[
                  ['🧊 냉장고', '등록된 식품 목록. 냉장/냉동/임박 카운트가 상단에 표시됩니다.'],
                  ['💡 추천', '보관 중인 식품 기반 레시피 24종 자동 추천. 탭별 상세 모달과 조리 타이머 제공.'],
                  ['🛒 장보기', '소진된 재료 재구매 리스트. 쇼핑몰 바로 연결.'],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-3 border border-gray-100 rounded-xl p-3">
                    <span className="font-bold text-sm shrink-0 w-20">{t}</span>
                    <span className="text-sm text-gray-600">{d}</span>
                  </div>
                ))}
              </div>

              <SubTitle>식품 카드 사용법</SubTitle>
              <Step n={1}>카드를 탭하면 펼쳐집니다. (한 번에 하나만 열림)</Step>
              <Step n={2}>펼쳐진 카드 하단의 <strong>🗑 삭제</strong> 버튼으로 제거합니다.</Step>
              <Step n={3}>삭제 직후 하단에 <strong>"되돌리기"</strong> 버튼이 표시됩니다. 실수로 삭제했다면 바로 탭하세요.</Step>
              <Step n={4}>"소진"으로 제거하면 마이 → 소진 이력에 기록됩니다.</Step>

              <SubTitle>AI 냉장고 위치 추천</SubTitle>
              <p className="text-gray-600 mb-2">식품 등록 시 AI가 냉장고 어느 칸에 넣을지 자동으로 추천합니다. 마이 → 사용자 탭에서 보유한 냉장고 모델(양문형·4도어·1도어·김치냉장고)을 먼저 선택하면 더 정확한 추천을 받을 수 있습니다.</p>

              <Tip>"오늘 뭐 먹지?" 버튼을 탭하면 보관 중인 식품으로 만들 수 있는 레시피를 랜덤으로 추천합니다.</Tip>
            </Row>

            <SubTitle>보관 위치별 필터</SubTitle>
            <p className="text-gray-600 mb-3">냉장고 탭 내에서 <strong>전체 / 냉장 / 냉동 / 실온</strong>으로 필터링할 수 있습니다. 냉장고 아이콘을 탭하면 냉장고 모델별 칸 구조 시각화 화면으로 전환됩니다.</p>
          </section>

          <Divider />

          {/* ── 옷장 ─────────────────────────────── */}
          <section>
            <SectionTitle id="closet">옷장</SectionTitle>
            <p className="text-gray-500 mb-6">의류를 관리하고, 날씨·계절 기반 코디를 추천받으며, 안 입는 옷을 중고·기부로 처분합니다.</p>

            <Row screen={
              <PhoneFrame src="/help/screen-closet.jpg" alt="옷장 화면" caption="옷장 — 👔옷장 탭" />
            }>
              <SubTitle>3탭 구조</SubTitle>
              <div className="space-y-2 mb-4">
                {[
                  ['👔 옷장', '등록된 의류 목록. 이름·두께·어울림·사이즈·착용 빈도로 정렬 가능.'],
                  ['👗 코디', '날씨·계절 기반 자동 코디 생성. 2×2 이미지 콜라주로 한눈에 확인.'],
                  ['🛍️ 쇼핑', '파트너 서비스 연결. 중고 판매·기부·보관 서비스 바로 연결.'],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-3 border border-gray-100 rounded-xl p-3">
                    <span className="font-bold text-sm shrink-0 w-20">{t}</span>
                    <span className="text-sm text-gray-600">{d}</span>
                  </div>
                ))}
              </div>

              <SubTitle>코디 추천 사용법</SubTitle>
              <Step n={1}>코디 탭으로 이동하면 오늘 날씨에 맞는 코디가 자동 생성됩니다.</Step>
              <Step n={2}>코디 카드를 탭하면 구성 아이템 상세 모달이 열립니다.</Step>
              <Step n={3}><strong>♡ 저장</strong>을 탭하면 이 조합이 다음번 추천에 더 자주 등장합니다.</Step>
              <Step n={4}><strong>"오늘 입기"</strong>를 탭하면 코디를 구성하는 아이템들이 모두 착용 기록됩니다.</Step>

              <SubTitle>처분 도우미</SubTitle>
              <p className="text-gray-600 mb-2">6개월 이상 착용 기록이 없는 옷에 처분 메뉴가 표시됩니다.</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ['📦 중고', '당근마켓·번개장터·KREAM'],
                  ['🎁 기부', '아름다운가게·굿윌·옷캔'],
                  ['🗂️ 보관', '세탁특공대·다락'],
                ].map(([t, d]) => (
                  <div key={t} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="font-semibold">{t}</p>
                    <p className="text-gray-500 mt-0.5 leading-tight">{d}</p>
                  </div>
                ))}
              </div>
            </Row>

            <Tip>사이즈 매칭 기능을 사용하려면 마이 → 사용자 탭 → 프로필에서 키·체중을 먼저 입력하세요.</Tip>
          </section>

          <Divider />

          {/* ── AI 자동 등록 ─────────────────────────── */}
          <section>
            <SectionTitle id="ai">AI 자동 등록</SectionTitle>
            <p className="text-gray-500 mb-6">하단 탭바 중앙 <strong>+ 버튼</strong>을 탭하면 AI 등록 화면이 열립니다. 사진·텍스트·URL 세 가지 방식으로 아이템을 자동 인식합니다.</p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: '📷', title: '사진 분석',
                  limit: '하루 5회',
                  steps: ['카메라로 촬영하거나 갤러리에서 선택', '식품 라벨·의류 사이즈표·쇼핑백 등 촬영', 'AI가 이름·유통기한·사이즈 자동 추출', '결과 확인 후 수정 → 등록 완료'],
                },
                {
                  icon: '📝', title: '텍스트 파싱',
                  limit: '하루 10회',
                  steps: ['영수증·이메일·쇼핑 내역 텍스트 붙여넣기', '"닭가슴살 300g 2개, 우유 1L" 같은 자유 형식 OK', 'AI가 품목·수량·가격 자동 분리', '여러 항목을 한 번에 등록 가능'],
                },
                {
                  icon: '🔗', title: 'URL 분석',
                  limit: '하루 2회',
                  steps: ['쇼핑몰 상품 페이지 주소 복사', 'URL 입력란에 붙여넣기', 'AI가 상품명·가격·사이즈 자동 추출', '결과 확인 후 등록'],
                },
              ].map((m) => (
                <div key={m.title} className="border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold flex items-center gap-1.5"><span className="text-xl">{m.icon}</span>{m.title}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{m.limit}</span>
                  </div>
                  <ol className="space-y-1.5">
                    {m.steps.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <SubTitle>추가 AI 기능</SubTitle>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { icon: '🥗', title: '영양 분석', limit: '하루 2회', desc: '식품 등록 시 칼로리·단백질·탄수화물 자동 추출. 마이 → 요약 탭에서 영양 현황 확인.' },
                { icon: '📦', title: '보관 위치 추천', limit: '하루 5회', desc: '냉장고 어느 칸에 보관할지 AI가 자동 추천. 냉장고 모델 설정 시 더 정확해집니다.' },
              ].map((f) => (
                <div key={f.title} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm"><span className="mr-1.5">{f.icon}</span>{f.title}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{f.limit}</span>
                  </div>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>

            <Warn>AI 사용량은 하루 자정에 자동 초기화됩니다. 한도 초과 시 당일 AI 기능이 제한되며, 직접 수동 입력은 제한 없이 사용할 수 있습니다.</Warn>
          </section>

          <Divider />

          {/* ── 알림 ─────────────────────────────── */}
          <section>
            <SectionTitle id="notify">알림</SectionTitle>
            <p className="text-gray-500 mb-6">유통기한·재구매·날씨·시즌 변경을 자동으로 알려줍니다. 설정 → 알림 설정에서 종류별로 켜고 끌 수 있습니다.</p>

            <div className="space-y-3">
              {[
                { badge: '홈 배너', color: 'bg-red-50 border-red-100 text-red-700', bdg: 'bg-red-100 text-red-600',
                  title: '긴급 알림', desc: 'D-Day(당일 만료) 식품이 있을 때 홈 화면 배너로 강조 표시됩니다.' },
                { badge: '홈 배너', color: 'bg-amber-50 border-amber-100 text-amber-700', bdg: 'bg-amber-100 text-amber-600',
                  title: '재구매 알림', desc: '자주 구매하는 재료의 구매 주기가 도래하면 홈 배너로 안내합니다.' },
                { badge: '홈 배너', color: 'bg-green-50 border-green-100 text-green-700', bdg: 'bg-green-100 text-green-600',
                  title: '시즌 변경 알림', desc: '계절이 바뀌는 시기(21일 전)에 옷장 정리 및 계절 식품 안내를 보냅니다.' },
                { badge: '앱 알림', color: 'bg-blue-50 border-blue-100 text-blue-700', bdg: 'bg-blue-100 text-blue-600',
                  title: 'D-Day 알림', desc: '당일 만료 식품을 오전에 알림으로 보냅니다.' },
                { badge: '앱 알림', color: 'bg-indigo-50 border-indigo-100 text-indigo-700', bdg: 'bg-indigo-100 text-indigo-600',
                  title: 'D-1 알림', desc: '내일 만료 식품 + 내일 날씨에 맞는 코디를 저녁에 미리 안내합니다.' },
                { badge: '앱 알림', color: 'bg-purple-50 border-purple-100 text-purple-700', bdg: 'bg-purple-100 text-purple-600',
                  title: 'D-3 안내', desc: '3일 후 만료 예정 식품을 오전 10시에 미리 알립니다.' },
                { badge: '앱 알림', color: 'bg-sky-50 border-sky-100 text-sky-700', bdg: 'bg-sky-100 text-sky-600',
                  title: '날씨 알림', desc: '폭우·폭설·한파 등 기상 이변 감지 시 오늘 코디 제안을 보냅니다.' },
              ].map((a) => (
                <div key={a.title} className={`border rounded-xl p-4 ${a.color} flex gap-3`}>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full h-fit shrink-0 ${a.bdg}`}>{a.badge}</span>
                  <div>
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-sm mt-0.5 opacity-80">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Tip>설정 → 알림 미리보기 버튼으로 각 알림이 어떻게 표시되는지 미리 확인할 수 있습니다.</Tip>
          </section>

          <Divider />

          {/* ── 마이페이지 ─────────────────────────── */}
          <section>
            <SectionTitle id="mypage">마이페이지</SectionTitle>
            <p className="text-gray-500 mb-6">프로필 전환·활동 통계·연간 기록·Pro 예고 등을 확인합니다.</p>

            <Row screen={
              <PhoneFrame src="/help/screen-mypage.jpg" alt="마이페이지 화면" caption="마이페이지 — 사용자 탭" />
            }>
              <SubTitle>4탭 구조</SubTitle>
              <div className="space-y-2 mb-4">
                {[
                  ['👤 사용자', '프로필 카드·사용자 교체·프로필 관리·냉장고 모델 선택'],
                  ['💳 요금제', '현재 플랜(무료/Pro)·AI 사용 현황·Pro 예고'],
                  ['📊 요약', '영양 현황·월별 지출·재구매 주기·연간 히스토그램'],
                  ['🛒 쇼핑', '등록 아이템별 재구매 추천 링크'],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-3 border border-gray-100 rounded-xl p-3">
                    <span className="font-bold text-sm shrink-0 w-24">{t}</span>
                    <span className="text-sm text-gray-600">{d}</span>
                  </div>
                ))}
              </div>

              <SubTitle>사용자(프로필) 전환</SubTitle>
              <Step n={1}>사용자 탭 상단 프로필 카드의 <strong>"교체"</strong> 버튼을 탭합니다.</Step>
              <Step n={2}>바텀시트에 등록된 프로필 목록이 표시됩니다.</Step>
              <Step n={3}>원하는 프로필을 탭하면 현재 사용자가 전환됩니다.</Step>

              <SubTitle>프로필 추가</SubTitle>
              <Step n={1}>사용자 탭 하단의 <strong>"+ 가족·다른 구성원 추가"</strong>를 탭합니다.</Step>
              <Step n={2}>이름·관계·아바타(이모지 또는 사진)를 설정합니다.</Step>
              <Step n={3}>저장 후 교체 버튼으로 해당 프로필로 전환합니다.</Step>
            </Row>

            <SubTitle>연간 활동 히스토그램</SubTitle>
            <p className="text-gray-600 mb-3">요약 탭 하단에서 올해 1월~12월의 조리·착용·소진 활동을 월별 막대 그래프로 확인합니다. 연말 페이스 예측도 함께 표시됩니다.</p>
          </section>

          <Divider />

          {/* ── 설정 ─────────────────────────────── */}
          <section>
            <SectionTitle id="settings">설정</SectionTitle>
            <p className="text-gray-500 mb-6">알림·백업·내보내기·앱 초기화를 관리합니다.</p>

            <Row screen={
              <PhoneFrame src="/help/screen-settings.jpg" alt="설정 화면" caption="설정 화면" />
            }>
              <SubTitle>알림 설정</SubTitle>
              <p className="text-gray-600 mb-3">보관 기한 임박 알림, 코디 추천 알림, 할인 정보 알림을 각각 켜고 끌 수 있습니다.</p>

              <SubTitle>백업 & 내보내기</SubTitle>
              <div className="space-y-2">
                {[
                  ['지금 백업하기', '전체 데이터(이미지 포함)를 JSON 파일로 기기에 저장합니다.'],
                  ['백업에서 복원', '이전에 저장한 백업 파일을 불러와 데이터를 복구합니다.'],
                  ['JSON 내보내기', '아이템 목록을 JSON 파일로 저장합니다. (이미지 제외)'],
                  ['CSV 내보내기', '아이템 목록을 엑셀·Numbers에서 열 수 있는 CSV로 저장합니다.'],
                ].map(([t, d]) => (
                  <div key={t} className="flex gap-3 text-sm border-b border-gray-50 pb-2">
                    <span className="font-semibold w-32 shrink-0">{t}</span>
                    <span className="text-gray-600">{d}</span>
                  </div>
                ))}
              </div>

              <Warn>7일 이상 백업하지 않으면 홈 화면에 백업 권장 배너가 표시됩니다. 브라우저 캐시 삭제 시 데이터가 사라질 수 있으므로 정기 백업을 권장합니다.</Warn>
            </Row>

            <SubTitle>앱 초기화</SubTitle>
            <p className="text-gray-600 mb-2">설정 하단 위험 구역에서 모든 데이터를 초기화할 수 있습니다. 초기화는 되돌릴 수 없으므로, 실행 전 반드시 백업을 먼저 진행하세요. 초기화 버튼을 탭하면 자동으로 백업 저장 후 초기화가 진행됩니다.</p>
          </section>

          <Divider />

          {/* ── FAQ ─────────────────────────────── */}
          <section>
            <SectionTitle id="faq">자주 묻는 질문</SectionTitle>
            <div className="space-y-4 mt-4">
              {FAQS.map((f, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-5">
                  <p className="font-semibold text-gray-900 mb-2 flex gap-2">
                    <span className="text-indigo-500 shrink-0">Q.</span>{f.q}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed pl-6">{f.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">이 가이드에서 답을 찾지 못하셨나요?</p>
              <p className="text-sm text-gray-700">설정 → 오류 기록에서 로그를 복사한 뒤, 상황 설명과 함께 문의해 주세요.</p>
            </div>
          </section>

          {/* 푸터 */}
          <footer className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>NEMOA · 데이터는 내 휴대폰에만</span>
            <Link href="/help" className="hover:text-gray-600 transition-colors">모바일 도움말 →</Link>
          </footer>

        </main>
      </div>
    </div>
  );
}
