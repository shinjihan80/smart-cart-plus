'use client';

import { useState, useRef, useCallback } from 'react';
import { CartItem, isFoodItem, isClothingItem, isEnrichedClothingItem, ClothingItem } from '@/types';
import { loggedFetch, agentIdFromEndpoint } from '@/lib/agentLogger';

interface TextImportModalProps {
  onClose:  () => void;
  onImport: (items: CartItem[]) => void;
}

type InputTab  = 'image' | 'text' | 'url';
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
function TabBar({ active, onChange }: { active: InputTab; onChange: (t: InputTab) => void }) {
  const tabs: { key: InputTab; label: string; emoji: string }[] = [
    { key: 'image', label: '사진 분석', emoji: '📷' },
    { key: 'text',  label: '텍스트',   emoji: '📝' },
    { key: 'url',   label: 'URL',     emoji: '🔗' },
  ];
  return (
    <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
      {tabs.map(({ key, label, emoji }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            active === key
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>{emoji}</span>{label}
        </button>
      ))}
    </div>
  );
}

// ── 단계 표시 ─────────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: ModalStep }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${step === 'input' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-400'}`}>1</span>
      <span className={`text-xs font-medium ${step === 'input' ? 'text-brand-primary' : 'text-gray-400'}`}>입력</span>
      <div className="flex-1 h-px bg-gray-200" />
      <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${step === 'confirm' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
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
          <span className="text-3xl">📷</span>
          <p className="text-sm font-medium text-gray-500">사진을 끌어다 놓거나 클릭해서 선택</p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP · 최대 5MB</p>
          <div className="flex gap-2 mt-1 flex-wrap justify-center px-4">
            {['식품 라벨', '사이즈표', '세탁 정보'].map((hint) => (
              <span key={hint} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400">
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
            ✕
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
          <span key={site} className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-500">
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

// ── 도메인별 아이템 상세 태그 ──────────────────────────────────────────────────

function FoodConfirmDetail({ item }: { item: Extract<CartItem, { category: '식품' }> }) {
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.purchaseDate);
  expiry.setDate(expiry.getDate() + item.baseShelfLifeDays);
  const dDay    = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = dDay <= 2;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
        {STORAGE_LABEL[item.storageType] ?? item.storageType}
      </span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
        isUrgent ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {dDay <= 0 ? '만료' : `D-${dDay}`}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
        {item.baseShelfLifeDays}일 보관
      </span>
    </div>
  );
}

function EnrichedFashionConfirmDetail({ item }: { item: import('@/types').EnrichedClothingItem }) {
  const attrBadges: string[] = [];
  if (item.attributes?.sheerness === true)  attrBadges.push('비침 있음');
  if (item.attributes?.sheerness === false) attrBadges.push('비침 없음');
  if (item.attributes?.stretch === true)    attrBadges.push('신축성 있음');
  if (item.attributes?.stretch === false)   attrBadges.push('신축성 없음');
  if (item.attributes?.lining === true)     attrBadges.push('안감 있음');
  if (item.attributes?.lining === false)    attrBadges.push('안감 없음');

  const hasMeasurements = item.measurements && Object.keys(item.measurements).length > 0;

  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{item.size}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{THICKNESS_LABEL[item.thickness] ?? item.thickness}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{item.material}</span>
      </div>
      {attrBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {attrBadges.map((b) => (
            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary font-medium">{b}</span>
          ))}
        </div>
      )}
      {hasMeasurements && (
        <div className="flex flex-wrap gap-1">
          {item.measurements?.chest        && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">가슴 {item.measurements.chest}cm</span>}
          {item.measurements?.totalLength  && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">총장 {item.measurements.totalLength}cm</span>}
          {item.measurements?.waist        && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">허리 {item.measurements.waist}cm</span>}
          {item.measurements?.waistBanding && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">밴딩</span>}
        </div>
      )}
      {item.washingTip && (
        <p className="text-[10px] text-gray-400 leading-relaxed">{item.washingTip}</p>
      )}
    </div>
  );
}

function BasicClothingConfirmDetail({ item }: { item: ClothingItem }) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{item.size}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{THICKNESS_LABEL[item.thickness] ?? item.thickness}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{item.material}</span>
    </div>
  );
}

function ItemDetailTags({ item }: { item: CartItem }) {
  if (isFoodItem(item))              return <FoodConfirmDetail item={item} />;
  if (isEnrichedClothingItem(item))  return <EnrichedFashionConfirmDetail item={item} />;
  if (isClothingItem(item))          return <BasicClothingConfirmDetail item={item as ClothingItem} />;
  return null;
}

// ── 결과 확인 단계 ─────────────────────────────────────────────────────────────
function StepConfirm({
  items, setItems, domainSummary, onConfirm, onBack,
}: {
  items: CartItem[];
  setItems: (v: CartItem[]) => void;
  domainSummary?: { food: number; fashion: number };
  onConfirm: () => void;
  onBack: () => void;
}) {
  function updateName(id: string, name: string) {
    setItems(items.map((item) => (item.id === id ? { ...item, name } : item)));
  }
  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <button aria-label="이전 단계로" onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-gray-900">결과 확인 및 수정</h2>
      </div>

      <StepIndicator step="confirm" />

      {domainSummary && (domainSummary.food > 0 || domainSummary.fashion > 0) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {domainSummary.food > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold">
              🥦 식품 {domainSummary.food}개 감지됨
            </span>
          )}
          {domainSummary.fashion > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-semibold">
              👗 패션 {domainSummary.fashion}개 감지됨
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-3">
        네모아가 추출한 목록입니다. 이름 수정 또는 불필요한 항목 삭제 후 추가하세요.
      </p>

      <div className="flex flex-col gap-y-2 max-h-64 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-start gap-2">
            <span className="mt-0.5 text-base shrink-0">
              {isFoodItem(item) ? '🥦' : '👗'}
            </span>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateName(item.id, e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b border-transparent focus:border-brand-primary pb-0.5"
              />
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-400 mt-1 mb-0.5">
                {item.category}
              </span>
              <ItemDetailTags item={item} />
            </div>
            <button aria-label="항목 삭제" onClick={() => removeItem(item.id)} className="shrink-0 mt-0.5 text-gray-300 hover:text-red-400 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6">
          모든 항목이 삭제됐어요.<br />
          <button onClick={onBack} className="text-brand-primary underline mt-1">다시 입력하기</button>
        </p>
      )}

      <button
        onClick={onConfirm}
        disabled={items.length === 0}
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
  const [step, setStep]               = useState<ModalStep>('input');
  const [activeTab, setActiveTab]     = useState<InputTab>('image');
  const [parsedItems, setParsedItems] = useState<CartItem[]>([]);
  const [domainSummary, setDomainSummary] = useState<{ food: number; fashion: number } | undefined>();
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

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

      if (data.error) { setError(data.error); return; }
      if (!data.items || data.items.length === 0) {
        setError('상품 정보를 찾지 못했습니다. 다른 내용을 시도해보세요.');
        return;
      }

      setParsedItems(data.items);
      setDomainSummary(data.domain_summary);
      setStep('confirm');

    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    onImport(parsedItems);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-5 pb-8" style={{ boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.1)' }}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        {step === 'input' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">사진/스크린샷으로 자동 분석</h2>
              <button aria-label="닫기" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <StepIndicator step="input" />
            <TabBar active={activeTab} onChange={handleTabChange} />

            {activeTab === 'image' && (
              <ImageTab
                file={imageFile} setFile={setImageFile}
                preview={imagePreview} setPreview={setImagePreview}
                loading={loading} onSubmit={handleAnalyze}
              />
            )}
            {activeTab === 'text' && (
              <TextTab text={text} setText={setText} loading={loading} onSubmit={handleAnalyze} />
            )}
            {activeTab === 'url' && (
              <UrlTab url={url} setUrl={setUrl} loading={loading} onSubmit={handleAnalyze} />
            )}

            {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
          </>
        ) : (
          <StepConfirm
            items={parsedItems}
            setItems={setParsedItems}
            domainSummary={domainSummary}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
