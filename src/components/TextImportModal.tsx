'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { CartItem, isFoodItem, isClothingItem, ClothingItem } from '@/types';
import { loggedFetch, agentIdFromEndpoint } from '@/lib/agentLogger';
import { useProfiles, FREE_PROFILE_LIMIT, type Relation } from '@/lib/profile';
import { useAiQuota, type AiAgent } from '@/lib/aiQuota';
import { useMonthlyVisionQuota } from '@/lib/monthlyVisionQuota';
import { usePlan } from '@/lib/usePlan';
import RewardedAdModal from '@/components/RewardedAdModal';
import { pickImage, resizeAndEncode } from '@/lib/imageUtils';
import { FOOD_ICON, FASHION_ICON } from '@/lib/iconMap';
import { Camera, Lock, X as XIcon } from 'lucide-react';
import EmojiIcon from '@/components/EmojiIcon';
import FridgeSectionPicker from '@/components/fridge/FridgeSectionPicker';
import { getRemainingDays } from '@/lib/expirySelectors';
import { todayLocalStr, expiryDateStr, daysBetween, localMidnight } from '@/lib/dateMath';
import { EXPIRY_LABEL, classifyExpiry } from '@/lib/expiryThresholds';
import { inferFoodCategory, inferFoodDefaults } from '@/lib/ingredientInference';
import { useModalA11y } from '@/lib/useModalA11y';

const AGENT_LABEL: Record<AiAgent, string> = {
  vision: '사진 분석', parser: '텍스트 파싱', nutrition: '영양 분석', url: 'URL 분석', fridgeSection: '보관 위치 추천',
};

interface TextImportModalProps {
  onClose:  () => void;
  onImport: (items: CartItem[]) => void;
}

type InputTab  = 'manual' | 'image' | 'text' | 'url';
type ModalStep = 'input' | 'confirm';

const STORAGE_LABEL:   Record<string, string> = { 냉장: '❄️ 냉장', 냉동: '🧊 냉동', 실온: '📦 실온' };
const THICKNESS_LABEL: Record<string, string> = { 얇음: '🌬️ 얇음', 보통: '👕 보통', 두꺼움: '🧥 두꺼움' };

const TEXT_PLACEHOLDER = `예시:
쿠팡 주문 확인
- 친환경 샐러드 믹스 1팩 (냉장 보관)
- 유니클로 히트텍 울 크루넥 L 사이즈

또는 직접 입력:
딸기 2팩 구매 (2026-04-17)
나이키 에어포스1 260mm`;

// ── 이미지 리사이즈 (클라이언트 사이드) ─────────────────────────────────────
async function resizeImage(file: File, maxPx = 1200): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

// 썸네일 base64 생성 (아이템 이미지용, 작게)
async function toThumbnailBase64(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = URL.createObjectURL(file);
  });
}

// ── 탭 헤더 ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, isPro }: {
  active:   InputTab;
  onChange: (t: InputTab) => void;
  isPro:    boolean;
}) {
  const tabs: { key: InputTab; label: string; emoji: string; proOnly: boolean }[] = [
    { key: 'manual', label: '직접입력', emoji: '✏️', proOnly: false },
    { key: 'image',  label: '사진',    emoji: '📷', proOnly: false },
    { key: 'text',   label: '텍스트', emoji: '📝', proOnly: false },
    { key: 'url',    label: 'URL',    emoji: '🔗', proOnly: true  },
  ];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
      {tabs.map(({ key, label, emoji, proOnly }) => {
        const locked = proOnly && !isPro;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              active === key
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <EmojiIcon emoji={emoji} size={12} className="text-current" />
            {label}
            {locked && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-brand-primary rounded-full flex items-center justify-center">
                <Lock size={7} strokeWidth={3} className="text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Pro 잠금 안내 (사진·URL 탭 — 무료 사용자) ────────────────────────────────
function ProLockedTab({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
        <Lock size={20} className="text-brand-primary" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">{feature}</p>
        <p className="text-xs text-gray-400 mt-1">Pro Lite 이상 플랜에서 이용할 수 있어요</p>
      </div>
      <Link
        href="/settings"
        className="text-xs font-semibold px-4 py-2 rounded-full bg-brand-primary text-white hover:opacity-90"
      >
        플랜 업그레이드 →
      </Link>
    </div>
  );
}

// ── 단계 표시 ─────────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: ModalStep }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-sm font-bold ${step === 'input' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-400'}`}>1</span>
      <span className={`text-xs font-medium ${step === 'input' ? 'text-brand-primary' : 'text-gray-400'}`}>입력</span>
      <div className="flex-1 h-px bg-gray-200" />
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-sm font-bold ${step === 'confirm' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
      <span className={`text-xs font-medium ${step === 'confirm' ? 'text-brand-primary' : 'text-gray-400'}`}>결과 확인</span>
    </div>
  );
}

// ── 이미지 탭 (주요 진입점) ───────────────────────────────────────────────────
function ImageTab({
  file, setFile, preview, setPreview, loading, onSubmit,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  preview: string | null;
  setPreview: (p: string | null) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <p className="text-xs text-gray-400 mb-3">
        식품 뒷면 라벨, 의류 사이즈표, 세탁 정보 캡처본을 올려주세요. 네모아가 자동으로 분류해 정보를 추출합니다.
        <br />분석을 위해 사진이 AI(Google Gemini)로 전송돼요 — 저장은 이 기기에만 남아요.
      </p>

      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 h-44 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
            dragging ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-gray-200 bg-gray-50 hover:border-brand-primary/30'
          }`}
        >
          <EmojiIcon emoji="📷" size={28} className="text-gray-500" />
          <p className="text-sm font-medium text-gray-500">사진을 끌어다 놓거나 클릭해서 선택</p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP · 최대 5MB</p>
          <div className="flex gap-2 mt-1 flex-wrap justify-center px-4">
            {['식품 라벨', '사이즈표', '세탁 정보'].map((hint) => (
              <span key={hint} className="text-sm px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400">
                {hint}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="미리보기" className="w-full h-full object-contain" />
          <button
            aria-label="이미지 제거"
            onClick={() => { setFile(null); setPreview(null); }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/70"
          >
            <EmojiIcon emoji="✕" size={11} className="text-white" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!preview && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }
            }}
            className="flex-1 rounded-2xl border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            🖼️ 갤러리에서 선택
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }
            }}
            className="flex-1 rounded-2xl border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
          >
            📸 카메라로 촬영
          </button>
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!file || loading}
        className="mt-3 w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
      >
        {loading ? <LoadingSpinner label="AI 이미지 분석 중…" /> : 'AI로 자동 분석하기'}
      </button>
    </>
  );
}

// ── 텍스트 탭 ─────────────────────────────────────────────────────────────────
function TextTab({
  text, setText, loading, onSubmit,
}: {
  text: string; setText: (v: string) => void; loading: boolean; onSubmit: () => void;
}) {
  return (
    <>
      <p className="text-xs text-gray-400 mb-3">
        이메일, 영수증, 구매 내역 텍스트를 붙여넣으면 네모아가 상품 정보를 추출합니다.
        <br />분석을 위해 붙여넣은 텍스트가 AI(Google Gemini)로 전송돼요 — 이름·주소 등 개인정보가
        포함된 부분은 지우고 붙여넣는 걸 권장해요.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={TEXT_PLACEHOLDER}
        rows={7}
        disabled={loading}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
      />
      <button
        onClick={onSubmit}
        disabled={!text.trim() || loading}
        className="mt-3 w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
      >
        {loading ? <LoadingSpinner label="네모아가 분석 중…" /> : '네모아에게 맡기기'}
      </button>
    </>
  );
}

// ── URL 탭 ────────────────────────────────────────────────────────────────────
function ManualTab({ onPick }: { onPick: (domain: 'food' | 'clothing') => void }) {
  return (
    <>
      <p className="text-xs text-gray-400 mb-3">
        AI 없이 바로 등록해요. 이름만 입력해도 돼요 — 나머지는 나중에 고쳐도 괜찮아요.
        <br />AI 사용 횟수를 쓰지 않아요.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onPick('food')}
          className="flex flex-col items-center gap-1.5 py-5 rounded-2xl border border-gray-200 bg-gray-50 hover:border-brand-primary/40 hover:bg-brand-primary/5 active:scale-95 transition-all"
        >
          <span className="text-2xl" aria-hidden>🥦</span>
          <span className="text-sm font-semibold text-gray-800">식품 등록</span>
        </button>
        <button
          onClick={() => onPick('clothing')}
          className="flex flex-col items-center gap-1.5 py-5 rounded-2xl border border-gray-200 bg-gray-50 hover:border-brand-primary/40 hover:bg-brand-primary/5 active:scale-95 transition-all"
        >
          <span className="text-2xl" aria-hidden>👕</span>
          <span className="text-sm font-semibold text-gray-800">옷 등록</span>
        </button>
      </div>
    </>
  );
}

function UrlTab({
  url, setUrl, loading, onSubmit,
}: {
  url: string; setUrl: (v: string) => void; loading: boolean; onSubmit: () => void;
}) {
  return (
    <>
      <p className="text-xs text-gray-400 mb-3">
        쇼핑몰 상품 페이지 주소를 붙여넣으면 네모아가 상품 정보를 가져옵니다.
      </p>
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2 mb-3">
        💡 쿠팡·네이버쇼핑·무신사 등에서 상품 페이지를 열고 주소창의 URL을 복사하세요.
      </div>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://www.coupang.com/vp/products/..."
        disabled={loading}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
      />
      <div className="flex gap-2 mt-2 flex-wrap">
        {['쿠팡', '네이버쇼핑', '무신사', '마켓컬리'].map((site) => (
          <span key={site} className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-500">
            {site}
          </span>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={!url.trim() || loading}
        className="mt-3 w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
      >
        {loading ? <LoadingSpinner label="페이지 분석 중…" /> : 'AI로 분석하기'}
      </button>
    </>
  );
}

// ── 도메인별 편집 가능한 상세 폼 ──────────────────────────────────────────────

const FOOD_CATEGORIES: import('@/types').FoodCategory[] = [
  '채소·과일', '정육·계란', '수산·해산', '유제품', '음료',
  '간식·과자', '양념·소스', '면·즉석', '빵·베이커리', '건강식품', '기타 식품',
];
const STORAGE_TYPES: import('@/types').StorageType[] = ['냉장', '냉동', '실온'];
const THICKNESSES:   import('@/types').Thickness[]   = ['얇음', '보통', '두꺼움'];
const FASHION_CATEGORIES: import('@/types').FashionCategory[] = [
  '상의', '하의', '아우터', '원피스', '신발', '가방',
  '모자', '스카프', '안경', '선글라스', '시계', '주얼리', '기타 액세서리',
];

interface FieldEditProps<T extends CartItem> {
  item:   T;
  onUpdate: (patch: Partial<T>) => void;
}

function FoodConfirmDetail({ item, onUpdate }: FieldEditProps<Extract<CartItem, { category: '식품' }>>) {
  const dDay    = getRemainingDays(item);
  // 이 배지만 인라인 dDay<=2 임계값(2색: rose/emerald)을 따로 써서,
  // 다른 화면(냉장고 카드)은 D-2를 빨강으로 보여주는데 여기 등록폼은
  // D-2도 초록으로 렌더되는 모순이 났다(P1-76, E3 재실측 — "같은
  // D-2가 화면마다 다른 색"). classifyExpiry() 단일 소스로 통일해
  // 냉장고 카드(P1-68/P1-70)와 같은 3단(경고/앰버/녹색) 체계로 맞춘다.
  const bucket = classifyExpiry(dDay);
  const badgeClass =
    bucket === 'expired' || bucket === 'today' ? 'bg-rose-50 text-rose-500'
      : bucket === 'soon' ? 'bg-amber-50 text-amber-600'
      : 'bg-emerald-50 text-emerald-600';
  // 유통기한=구매일 당일(days===0)을 "앞설 수 없다"며 거부하던 버그
  // (P0-67, C4·E1·E2 실측) — 같은 날짜는 "이전"이 아니다. 마감할인·
  // 당일소비 식품은 구매일=유통기한이 흔한데, 예전엔 이걸 말없이
  // 거부하고 이전 값(열흘 뒤 추정치 등)으로 조용히 되돌렸다. 거부
  // 기준을 "이전 날짜일 때만"으로 좁히고, 거부되면 인라인 안내를 띄운다.
  const [expiryError, setExpiryError] = useState(false);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* 미리보기 배지 */}
      <div className="flex flex-wrap gap-1">
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${badgeClass}`}>
          {dDay < 0 ? EXPIRY_LABEL.over : `D-${dDay}`}
        </span>
      </div>

      {/* 편집 — 카테고리·보관·기한·구매일 */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">카테고리</span>
          <select
            value={item.foodCategory}
            onChange={(e) => onUpdate({ foodCategory: e.target.value as import('@/types').FoodCategory })}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">보관 방법</span>
          <select
            value={item.storageType}
            onChange={(e) => onUpdate({ storageType: e.target.value as import('@/types').StorageType })}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {STORAGE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">구매일</span>
          <input
            type="date"
            aria-label="구매일"
            value={item.purchaseDate}
            max={todayLocalStr()}
            onChange={(e) => {
              // 빈 값을 그대로 저장하면 localMidnight('')가 1900-01-01로
              // 승격돼(연도 없는 문자열) 유통기한이 "1900.01.23" 식으로
              // 깨지고 저장 버튼도 그대로 활성 상태였다(P0-65, 검토단 E2
              // 라이브 재현). 날짜 칸을 비워도 이전 값을 유지해 무효 상태
              // 자체가 생기지 않게 막는다.
              const v = e.target.value;
              if (v) onUpdate({ purchaseDate: v });
            }}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">유통기한 — 포장에 적힌 날짜</span>
          {/* 예전엔 "보관 기한(일)" 숫자칸뿐이라 포장지 날짜를 그대로 못
              넣고 구매일 기준으로 역산해야 했다(P0-33, 검토단 C1·C4·C8
              독립 발견) — 등록 시점부터 실제 날짜를 입력받는다.
              baseShelfLifeDays(상대일수)만 저장하면 확정 후 구매일을
              고칠 때 확정값이 조용히 깨진다(P0-33 재오픈, 검토단 E2·E3) —
              expiryDate(절대값)를 진실로 저장하고 baseShelfLifeDays는
              현재 구매일 기준 참고값으로만 같이 갱신한다. */}
          <input
            type="date"
            aria-label="유통기한"
            min={item.purchaseDate}
            value={expiryDateStr(item)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              const days = daysBetween(localMidnight(item.purchaseDate), localMidnight(v));
              if (days < 0) { setExpiryError(true); return; }
              setExpiryError(false);
              onUpdate({ expiryDate: v, baseShelfLifeDays: days, shelfLifeSource: 'user' });
            }}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-brand-primary/30 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          {expiryError && (
            <span className="text-[10px] text-rose-500">구매일({item.purchaseDate})보다 이전 날짜는 입력할 수 없어요.</span>
          )}
        </label>
        <FridgeSectionPicker
          itemName={item.name}
          foodCategory={item.foodCategory}
          storageType={item.storageType}
          value={item.fridgeSection}
          onChange={(section) => onUpdate({ fridgeSection: section })}
        />
      </div>
    </div>
  );
}

function FashionConfirmDetail({ item, onUpdate }: FieldEditProps<ClothingItem>) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] text-gray-500 font-medium">카테고리</span>
          <select
            value={item.category}
            onChange={(e) => onUpdate({ category: e.target.value as import('@/types').FashionCategory })}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {FASHION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">사이즈</span>
          <input
            type="text"
            value={item.size}
            onChange={(e) => onUpdate({ size: e.target.value })}
            placeholder="M / 32 / 260"
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 font-medium">두께</span>
          <select
            value={item.thickness}
            onChange={(e) => onUpdate({ thickness: e.target.value as import('@/types').Thickness })}
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          >
            {THICKNESSES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] text-gray-500 font-medium">소재</span>
          <input
            type="text"
            value={item.material}
            onChange={(e) => onUpdate({ material: e.target.value })}
            placeholder="면·울·폴리에스터…"
            className="text-xs px-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </label>
      </div>
    </div>
  );
}

function ItemDetailTags({ item, onUpdate }: { item: CartItem; onUpdate: (patch: Partial<CartItem>) => void }) {
  if (isFoodItem(item)) {
    return <FoodConfirmDetail item={item} onUpdate={onUpdate as (p: Partial<typeof item>) => void} />;
  }
  if (isClothingItem(item)) {
    return <FashionConfirmDetail item={item as ClothingItem} onUpdate={onUpdate as (p: Partial<ClothingItem>) => void} />;
  }
  return null;
}

// ── 결과 확인 단계 ─────────────────────────────────────────────────────────────
function StepConfirm({
  items, setItems, domainSummary, manualEntry, onConfirm, onBack,
}: {
  items: CartItem[];
  setItems: (v: CartItem[]) => void;
  domainSummary?: { food: number; fashion: number };
  manualEntry?: boolean;
  onConfirm: (tagged: CartItem[]) => void;
  onBack: () => void;
}) {
  const { profiles, add: addProfile } = useProfiles();
  // 모든 아이템 공통 소유자 — undefined = 공용
  const [ownerId, setOwnerId] = useState<string | undefined>(undefined);
  // 가족 추가 미니폼 — 항상 노출(위 주석이 잘못돼 있었다: 실제론
  // profiles.length와 무관하게 항상 렌더됨). 무료 3명 한도 검사가
  // useProfiles().add() 쪽에만 있던 적이 없어서(P0-69), 이 진입점이
  // 생기자 마이페이지 프로필 관리의 한도를 그대로 우회했다 — 이제
  // add()가 직접 한도를 판정하므로, 여기선 실패 사유만 보여준다.
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyRelation, setNewFamilyRelation] = useState<Relation>('자녀');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [familyLimitHit, setFamilyLimitHit] = useState(false);

  // 펼친 아이템 id 추적 — 한 번에 하나만
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // P1-96③ — 카드 목록이 max-h-[60vh] overflow-y-auto 스크롤 영역이라,
  // 카드를 펼쳐 목록 전체 높이가 늘어나도 scrollTop은 그대로라 방금 편집
  // 연 카드나 그 아래 카드의 보관일수 칩 줄이 스크롤 경계에 반쯤 잘린
  // 채로 남았다(C4 실측 — "저장 전 보관기한을 확인하는 유일한 화면인데
  // 숫자가 안 보여 결국 확인 없이 저장"). 펼친 카드를 자동으로 보이는
  // 위치까지 스크롤해 항상 전체가 보이게 한다.
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  useEffect(() => {
    if (!expandedId) return;
    const el = cardRefs.current.get(expandedId);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [expandedId]);

  // 직접입력에서 카테고리/보관법/보관기한을 사용자가 손댄 아이템 — 한 번
  // 손대면 이름을 계속 고쳐도 그 값을 재추론으로 덮어쓰지 않는다(P0-54).
  const [touched, setTouched] = useState<Set<string>>(new Set());
  // 현재 카테고리/보관법/보관기한이 "이름 기반 추론 성공"으로 채워진
  // 아이템 — 매칭 실패로 바뀔 때 이걸 봐야 "원래도 미추론"과 "직전엔
  // 추론 성공했었음"을 구분해 후자만 보수 기본값으로 되돌릴 수 있다.
  const [inferred, setInferred] = useState<Set<string>>(new Set());

  function updateName(id: string, name: string) {
    const current = items.find((it) => it.id === id);
    // "이름만 입력해도 돼요"라는 안내를 믿고 저장하면 카테고리·보관기한이
    // 항상 기타식품/7일로 고정돼 D-day가 틀리게 계산됐다(P0-54, 검토단
    // C1·C4 독립 발견) — 같은 레포에 있던 추론기(ingredientInference.ts,
    // 장보기→냉장고 경로에서는 이미 사용 중)를 직접입력에도 연결한다.
    const eligible = manualEntry && !touched.has(id) && !!current && isFoodItem(current);
    const foodCategory = eligible ? inferFoodCategory(name) : null;

    setItems(items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, name } as CartItem;
      if (!eligible) return next;
      if (foodCategory === '기타 식품') {
        // 원래부터 미추론 상태였으면 손댈 것 없음(보수값 그대로).
        // 직전에 추론이 성공했다가(예: "서울우유") 매칭 실패하는 이름
        // (예: "김치")으로 바뀐 경우는 그 성공값이 신호 없이 남던 부분
        // 회귀였다(P0-54 부분 회귀, 검토단 E2 라이브 재현) — 보수
        // 기본값(기타 식품/냉장/7일)으로 되돌린다.
        if (!inferred.has(id)) return next;
        return { ...next, foodCategory: '기타 식품', storageType: '냉장', baseShelfLifeDays: 7 };
      }
      const { storageType, baseShelfLifeDays } = inferFoodDefaults(foodCategory!);
      return { ...next, foodCategory: foodCategory!, storageType, baseShelfLifeDays };
    }));

    if (eligible) {
      setInferred((s) => {
        const next = new Set(s);
        if (foodCategory === '기타 식품') next.delete(id); else next.add(id);
        return next;
      });
    }
  }
  function updateItem(id: string, patch: Partial<CartItem>) {
    if ('foodCategory' in patch || 'storageType' in patch || 'baseShelfLifeDays' in patch) {
      setTouched((s) => new Set(s).add(id));
    }
    setItems(items.map((item) => (item.id === id ? ({ ...item, ...patch } as CartItem) : item)));
  }
  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }
  async function pickItemImage(id: string) {
    const file = await pickImage();
    if (!file) return;
    try {
      const dataUrl = await resizeAndEncode(file);
      setItems(items.map((item) => (item.id === id ? { ...item, imageUrl: dataUrl } : item)));
    } catch {
      // ignore
    }
  }
  function clearItemImage(id: string) {
    setItems(items.map((item) => {
      if (item.id !== id) return item;
      const { imageUrl: _ignored, ...rest } = item;
      return rest as CartItem;
    }));
  }
  function handleConfirm() {
    const tagged = items.map((item) => ({ ...item, ownerId }) as CartItem);
    onConfirm(tagged);
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <button aria-label="이전 단계로" onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-gray-900">{manualEntry ? '내용 확인' : '결과 확인 및 수정'}</h2>
      </div>

      <StepIndicator step="confirm" />

      {domainSummary && (domainSummary.food > 0 || domainSummary.fashion > 0) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {domainSummary.food > 0 && (
            <span className="text-sm px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
              🥦 식품 {domainSummary.food}개 감지됨
            </span>
          )}
          {domainSummary.fashion > 0 && (
            <span className="text-sm px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-semibold">
              👗 패션 {domainSummary.fashion}개 감지됨
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">
        {manualEntry
          ? '이름을 입력하고, 카드를 탭하면 카테고리·보관·사이즈 등을 직접 정할 수 있어요.'
          : '네모아가 추출한 목록입니다. 각 카드를 탭하면 카테고리·보관·사이즈 등을 직접 수정할 수 있어요.'}
      </p>

      {/* 소유자 선택 — 예전엔 profiles.length>=2일 때만 보여, 프로필이
          기본 1개(본인만)인 상태에선 이 UI 자체가 영구히 숨겨져 있었다.
          "본인·가족·공용 물품 분리"가 핵심 차별 기능인데 그걸 켤 유일한
          진입점(가족 추가)이 닫힌 채 아무도 문을 안 열어준 셈이다
          (P1-72①, C4·E1 발견 — "기능 부재"가 아니라 "발견 불가능한
          게이팅"). 1명일 때도 숨기지 말고 "공용·나·+가족 추가"로 보여준다
          — +가족 추가는 페이지 이동 없이 이 모달 안에서 바로 추가(등록
          중이던 내용을 잃지 않음). */}
      <div className="rounded-2xl bg-gray-50 px-3 py-2 mb-3">
        <p className="text-sm text-gray-500 mb-1.5">누구 것으로 등록할까요?</p>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setOwnerId(undefined)}
            className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
              !ownerId
                ? 'bg-gray-500 text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            공용
          </button>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setOwnerId(p.id)}
              className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                ownerId === p.id
                  ? 'bg-brand-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => { setShowAddFamily((v) => !v); setFamilyLimitHit(false); }}
            className="text-sm px-2 py-0.5 rounded-full bg-white border border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            + 가족 추가
          </button>
        </div>

        {showAddFamily && (
          <div className="mt-2 pt-2 border-t border-gray-200 flex flex-col gap-1.5">
            <div className="flex gap-1 flex-wrap">
              {(['배우자', '자녀', '부모', '기타'] as Relation[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setNewFamilyRelation(r)}
                  className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
                    newFamilyRelation === r
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="이름(예: 엄마, 큰아이)"
                className="flex-1 min-w-0 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
              />
              <button
                onClick={() => {
                  const trimmed = newFamilyName.trim();
                  if (!trimmed) return;
                  const result = addProfile(trimmed, newFamilyRelation);
                  if (!result.ok) {
                    setFamilyLimitHit(true);
                    return;
                  }
                  setOwnerId(result.profile.id);
                  setNewFamilyName('');
                  setFamilyLimitHit(false);
                  setShowAddFamily(false);
                }}
                disabled={!newFamilyName.trim()}
                className="shrink-0 text-sm font-semibold px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-opacity"
              >
                추가
              </button>
            </div>
            {familyLimitHit && (
              <p className="text-xs text-rose-500">
                무료는 가족 {FREE_PROFILE_LIMIT}명까지예요 — 지금은 &ldquo;공용&rdquo;으로 등록하고, 나중에 설정에서 바꿀 수 있어요.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-y-2 max-h-[60vh] overflow-y-auto pr-0.5 snap-y snap-proximity">
        {items.map((item) => {
          const Icon = isFoodItem(item)
            ? (FOOD_ICON[(item as import('@/types').FoodItem).foodCategory] ?? FOOD_ICON['기타 식품'])
            : (FASHION_ICON[(item as ClothingItem).category] ?? FASHION_ICON['기타 액세서리']);
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el);
                else cardRefs.current.delete(item.id);
              }}
              // shrink-0 — 부모가 flex-col + overflow-y-auto라, 플렉스박스
              // 스펙상 overflow가 visible이 아닌 flex 컨테이너의 자식은
              // "콘텐츠 기준 자동 최소 높이"가 0으로 바뀌어 카드가 자기
              // 내용(이미지+이름+칩 줄)보다 작게 짜부러들 수 있다 — 짜부러든
              // 높이를 카드의 overflow-hidden이 그대로 잘라, 칩 줄이
              // 카드 하단 경계에서 반쯤 잘려 보였다(P1-96③, C4 실측 라이브
              // 재현 — mock 5개 카드로 모든 카드의 보관일수 칩이 잘림을
              // 확인). shrink-0로 카드가 항상 콘텐츠 높이를 유지하게 하고,
              // 넘치는 건 부모의 overflow-y-auto가 스크롤로 처리하게 한다.
              className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shrink-0 snap-start"
            >
              <div className="px-3 py-3 flex items-start gap-3">
                {/* 이미지 영역 */}
                <button
                  type="button"
                  onClick={() => pickItemImage(item.id)}
                  aria-label="이미지 추가/변경"
                  className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center hover:border-brand-primary/40 transition-colors group"
                >
                  {item.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={16} className="text-white" />
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-gray-400">
                      <Icon size={16} strokeWidth={2} />
                      <span className="text-[9px] font-medium">사진 추가</span>
                    </div>
                  )}
                </button>
                {item.imageUrl && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearItemImage(item.id); }}
                    aria-label="이미지 제거"
                    className="-ml-3 -mt-1 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center shrink-0 self-start"
                  >
                    <XIcon size={11} strokeWidth={2.5} />
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  {/* 긴 이름(37자+)이 단일행 input에서 가로 스크롤돼 앞부분이
                      말줄임 없이 하드 클립되던 문제(P1-77, E3 실측) —
                      textarea 자동높이(최대 2줄, 넘으면 내부 스크롤)로 전환해
                      전체 이름을 줄바꿈으로 볼 수 있게 한다. 이름이 빈 칸이면
                      밑줄을 danger색으로 — 바로 아래 전역 오류 문장과 같은
                      타이밍에 떠서 "어느 칸이 비었는지" 바로 보이게 한다. */}
                  <textarea
                    value={item.name}
                    onChange={(e) => updateName(item.id, e.target.value.replace(/\n/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    aria-label="제품명"
                    autoFocus={items.length === 1 && !item.name}
                    placeholder={items.length === 1 && !item.name ? (isFoodItem(item) ? '이름 입력 (예: 계란)' : '이름 입력 (예: 반팔 티셔츠)') : undefined}
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = `${el.scrollHeight}px`;
                      }
                    }}
                    className={`w-full bg-transparent text-sm font-semibold text-brand-ink focus:outline-none border-b pb-0.5 resize-none break-words leading-snug max-h-12 overflow-y-auto ${
                      !item.name.trim() ? 'border-rose-300 focus:border-rose-400' : 'border-gray-200 focus:border-brand-primary'
                    }`}
                  />
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {item.category}
                    </span>
                    {isFoodItem(item) && (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          {(item as import('@/types').FoodItem).foodCategory}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          {STORAGE_LABEL[item.storageType] ?? item.storageType}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          {item.baseShelfLifeDays}일
                        </span>
                      </>
                    )}
                    {isClothingItem(item) && (
                      <>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          {(item as ClothingItem).size}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                          {THICKNESS_LABEL[(item as ClothingItem).thickness] ?? (item as ClothingItem).thickness}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* 우측: 편집 토글 + 삭제 */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={isExpanded ? '편집 닫기' : '편집 열기'}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                      isExpanded
                        ? 'bg-brand-primary text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-primary/40'
                    }`}
                  >
                    {isExpanded ? '닫기' : '편집'}
                  </button>
                  <button
                    aria-label="항목 삭제"
                    onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                  >
                    <XIcon size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* 펼친 상태 — 모든 필드 편집 폼 */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                  <ItemDetailTags
                    item={item}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
        💡 사진 영역을 탭하면 이미지를 추가할 수 있어요. 카드 오른쪽 ✕로 항목을 빼고, 저장하면 냉장고/옷장에 등록됩니다.
      </p>

      {items.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6">
          모든 항목이 삭제됐어요.<br />
          <button onClick={onBack} className="text-brand-primary underline mt-1">다시 입력하기</button>
        </p>
      )}

      {items.length > 0 && items.some((it) => !it.name.trim()) && (
        <p className="mt-2 text-xs text-brand-warning font-medium text-center">이름이 빈 항목이 있어요 — 위에서 입력해주세요.</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={
          items.length === 0
          || items.some((it) => !it.name.trim())
          || items.some((it) => isFoodItem(it) && !/^\d{4}-\d{2}-\d{2}$/.test(it.purchaseDate))
        }
        className="mt-4 w-full rounded-2xl bg-brand-primary py-3 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
      >
        {items.length > 0 ? `${items.length}개 추가하기` : '항목을 선택하세요'}
      </button>
    </>
  );
}

// ── 로딩 스피너 ───────────────────────────────────────────────────────────────
function LoadingSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label}
    </span>
  );
}

// ── 메인 모달 ─────────────────────────────────────────────────────────────────
export default function TextImportModal({ onClose, onImport }: TextImportModalProps) {
  const { canUse: canUseAi, consume: consumeAi, canGrantBonus, grantBonus } = useAiQuota();
  const monthlyVision = useMonthlyVisionQuota();
  const { isPro, isProMax } = usePlan();
  const [step, setStep]               = useState<ModalStep>('input');
  // 기본 탭은 AI가 아니라 직접입력 — 무료 사용자가 항목 하나 등록하려고
  // 매번 AI 한도를 쓰지 않도록 (검토단 C1/E1 발견: "우유 하나"에도 AI 호출 1회
  // 소모, 장보기 한 번에 하루 한도 소진)
  const [activeTab, setActiveTab]     = useState<InputTab>('manual');
  const [parsedItems, setParsedItems] = useState<CartItem[]>([]);
  // 2단계 확인 화면이 AI 문구("네모아가 추출한 목록입니다")를 쓸지 결정 —
  // 직접입력 경로에서도 AI 문구가 그대로 나오던 카피 모순 수정 (P0-32)
  const [manualEntry, setManualEntry] = useState(false);
  const [domainSummary, setDomainSummary] = useState<{ food: number; fashion: number } | undefined>();
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [rewardAgent, setRewardAgent] = useState<AiAgent | null>(null); // 광고 보기 모달 대상 agent

  const [text, setText]               = useState('');
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [url, setUrl]                 = useState('');

  async function callApi(
    endpoint: string,
    body: FormData | Record<string, unknown>,
  ): Promise<{ items?: CartItem[]; domain_summary?: { food: number; fashion: number }; error?: string }> {
    const isFormData = body instanceof FormData;
    const res = await loggedFetch(agentIdFromEndpoint(endpoint), endpoint, {
      method:  'POST',
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
      body:    isFormData ? body : JSON.stringify(body),
    });
    return res.json();
  }

  async function handleAnalyze() {
    // AI 쿼터 체크 — 탭에 따라 agent 결정
    const agent = activeTab === 'text' ? 'parser' : activeTab === 'image' ? 'vision' : activeTab === 'url' ? 'url' : null;

    if (agent === 'vision') {
      // 사진 분석은 모든 등급 공통으로 일일이 아니라 월간 한도로 관리
      if (!monthlyVision.canUse) {
        setError(`이번 달 사진 분석 사용량(${monthlyVision.limit}회)을 모두 썼어요. 다음 달 1일에 다시 이용할 수 있어요.`);
        return;
      }
    } else if (agent && !canUseAi(agent)) {
      if (!isPro && canGrantBonus(agent)) {
        setRewardAgent(agent);
      } else {
        setError(`오늘 ${AGENT_LABEL[agent]} 무료 사용량을 모두 썼어요. 자정 이후 다시 이용 가능해요.`);
      }
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let data: { items?: CartItem[]; domain_summary?: { food: number; fashion: number }; error?: string };

      if (activeTab === 'text') {
        data = await callApi('/api/agents/parser-agent', { rawText: text });

      } else if (activeTab === 'image' && imageFile) {
        // API 전송용 리사이즈
        const resized = await resizeImage(imageFile);
        const form = new FormData();
        form.append('image', new File([resized], imageFile.name, { type: 'image/jpeg' }));
        data = await callApi('/api/agents/vision-parser', form);

        // 썸네일 생성 → 추출된 아이템에 자동 첨부
        if (data.items && data.items.length > 0) {
          const thumb = await toThumbnailBase64(imageFile);
          data.items = data.items.map((item) => ({ ...item, imageUrl: thumb }) as CartItem);
        }

      } else if (activeTab === 'url') {
        data = await callApi('/api/agents/url-agent', { url });

      } else {
        return;
      }

      // 쿼터 소진은 성공 반환 후
      if (agent && !data.error) {
        if (agent === 'vision') monthlyVision.consume();
        else consumeAi(agent);
      }

      if (data.error) { setError(data.error); return; }
      if (!data.items || data.items.length === 0) {
        setError('상품 정보를 찾지 못했습니다. 다른 내용을 시도해보세요.');
        return;
      }

      setParsedItems(data.items);
      setDomainSummary(data.domain_summary);
      setManualEntry(false);
      setStep('confirm');

    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  function handleManualPick(domain: 'food' | 'clothing') {
    const id = `manual-${Date.now()}`;
    const blank: CartItem = domain === 'food'
      ? {
          id,
          name:              '',
          category:          '식품',
          foodCategory:      '기타 식품',
          storageType:       '냉장',
          baseShelfLifeDays: 7,
          purchaseDate:      todayLocalStr(),
        }
      : {
          id,
          name:      '',
          category:  '상의',
          size:      '',
          thickness: '보통',
          material:  '',
        };
    setParsedItems([blank]);
    setDomainSummary(undefined);
    setManualEntry(true);
    setStep('confirm');
  }

  function handleConfirm(tagged: CartItem[]) {
    // 의류 등록일 기록 — 옷장 정리 제안 90일+계절 게이팅용(P0-60 후속).
    // 입력 경로(수동/텍스트/이미지/URL) 무관하게 "지금 등록한다"는 사실은
    // 항상 참이라 이 한 지점에서 일괄 스탬프한다.
    const withRegisteredAt = tagged.map((item) =>
      isClothingItem(item) && !item.registeredAt
        ? { ...item, registeredAt: todayLocalStr() }
        : item,
    );
    onImport(withRegisteredAt);
    onClose();
  }

  function handleBack() {
    setStep('input');
    setError(null);
    setDomainSummary(undefined);
  }

  function handleTabChange(tab: InputTab) {
    setActiveTab(tab);
    setError(null);
  }

  // P2-44 — 등록 시트에 role="dialog"/aria-modal이 없어 열려 있는 동안에도
  // 뒤 화면(마이페이지 탭·백업 버튼 등)이 접근성 트리에 그대로 남았다
  // (C8 실측). 다른 시트(UpgradeSheet 등)와 같은 useModalA11y로 Esc 닫기·
  // 스크롤 잠금·포커스 복원을 맞춘다.
  useModalA11y(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="상품 정보 등록"
        className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-5 pb-8"
        style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.1)' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        {step === 'input' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">상품 정보 등록</h2>
              <button aria-label="닫기" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <StepIndicator step="input" />
            <TabBar active={activeTab} onChange={handleTabChange} isPro={isPro} />

            {activeTab === 'manual' && (
              <ManualTab onPick={handleManualPick} />
            )}
            {activeTab === 'image' && (
              <>
                <p className="text-[11px] text-gray-400 mb-2">
                  이번 달 사진 분석 남은 횟수 {isProMax ? '무제한' : `${monthlyVision.remaining}/${monthlyVision.limit}`}
                </p>
                <ImageTab
                  file={imageFile} setFile={setImageFile}
                  preview={imagePreview} setPreview={setImagePreview}
                  loading={loading} onSubmit={handleAnalyze}
                />
              </>
            )}
            {activeTab === 'text' && (
              <TextTab text={text} setText={setText} loading={loading} onSubmit={handleAnalyze} />
            )}
            {activeTab === 'url' && (
              isPro
                ? <UrlTab url={url} setUrl={setUrl} loading={loading} onSubmit={handleAnalyze} />
                : <ProLockedTab feature="URL 분석 (AI)" />
            )}

            {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}

            {rewardAgent && (
              <RewardedAdModal
                agentLabel={AGENT_LABEL[rewardAgent]}
                onClose={() => setRewardAgent(null)}
                onGranted={() => {
                  grantBonus(rewardAgent);
                  setRewardAgent(null);
                  setError(null);
                }}
              />
            )}
          </>
        ) : (
          <StepConfirm
            items={parsedItems}
            setItems={setParsedItems}
            domainSummary={domainSummary}
            manualEntry={manualEntry}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
