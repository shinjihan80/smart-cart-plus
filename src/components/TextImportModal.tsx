'use client';

import { useState } from 'react';
import { CartItem, FoodItem, ClothingItem, isFoodItem, isClothingItem } from '@/types';

interface TextImportModalProps {
  onClose: () => void;
  onImport: (items: CartItem[]) => void;
}

const PLACEHOLDER = `예시:
쿠팡 주문 확인
- 친환경 샐러드 믹스 1팩 (냉장 보관)
- 유니클로 히트텍 울 크루넥 L 사이즈

또는 직접 입력:
딸기 2팩 구매 (2026-04-16)
나이키 에어포스1 260mm`;

const STORAGE_LABEL: Record<string, string> = { 냉장: '❄️ 냉장', 냉동: '🧊 냉동', 실온: '📦 실온' };
const THICKNESS_LABEL: Record<string, string> = { 얇음: '🌬️ 얇음', 보통: '👕 보통', 두꺼움: '🧥 두꺼움' };

// ── 1단계: 텍스트 입력 ──────────────────────────────────────
function StepInput({
  text,
  setText,
  loading,
  error,
  onAnalyze,
  onClose,
}: {
  text: string;
  setText: (v: string) => void;
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-900">텍스트로 쇼핑 정보 추가</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="닫기">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">1</span>
        <span className="text-xs font-medium text-indigo-600">텍스트 입력</span>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-400 text-[10px] font-bold">2</span>
        <span className="text-xs text-gray-400">결과 확인</span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        이메일, 영수증, 구매 내역 텍스트를 붙여넣으면 AI가 상품 정보를 추출합니다.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={8}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        disabled={loading}
      />

      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}

      <button
        onClick={onAnalyze}
        disabled={!text.trim() || loading}
        className="mt-4 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            AI 분석 중…
          </span>
        ) : (
          'AI로 분석하기'
        )}
      </button>
    </>
  );
}

// ── 2단계: 결과 확인·수정 ────────────────────────────────────
function StepConfirm({
  items,
  setItems,
  onConfirm,
  onBack,
}: {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
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
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 -ml-1" aria-label="뒤로">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-gray-900">결과 확인 및 수정</h2>
      </div>

      {/* 단계 표시 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-400 text-[10px] font-bold">1</span>
        <span className="text-xs text-gray-400">텍스트 입력</span>
        <div className="flex-1 h-px bg-indigo-200" />
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">2</span>
        <span className="text-xs font-medium text-indigo-600">결과 확인</span>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        AI가 추출한 상품 목록입니다. 이름을 수정하거나 불필요한 항목은 삭제하세요.
      </p>

      {/* 항목 카드 목록 */}
      <div className="flex flex-col gap-y-2 max-h-64 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-start gap-2">
            {/* 카테고리 아이콘 */}
            <span className="mt-0.5 text-base shrink-0">
              {isFoodItem(item) ? '🥦' : item.category === '액세서리' ? '💍' : '👗'}
            </span>

            <div className="flex-1 min-w-0">
              {/* 이름 수정 인풋 */}
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateName(item.id, e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-0 border-b border-transparent focus:border-indigo-400 pb-0.5 truncate"
              />

              {/* 메타 정보 뱃지 */}
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                  {item.category}
                </span>
                {isFoodItem(item) && (
                  <>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {STORAGE_LABEL[item.storageType] ?? item.storageType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {item.baseShelfLifeDays}일
                    </span>
                  </>
                )}
                {isClothingItem(item) && (
                  <>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {item.size}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {THICKNESS_LABEL[item.thickness] ?? item.thickness}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                      {item.material}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 삭제 버튼 */}
            <button
              onClick={() => removeItem(item.id)}
              className="shrink-0 mt-0.5 text-gray-300 hover:text-red-400 transition-colors"
              aria-label="삭제"
            >
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
          <button onClick={onBack} className="text-indigo-500 underline mt-1">텍스트를 다시 입력하기</button>
        </p>
      )}

      <button
        onClick={onConfirm}
        disabled={items.length === 0}
        className="mt-4 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:scale-95"
      >
        {items.length > 0 ? `${items.length}개 추가하기` : '항목을 선택하세요'}
      </button>
    </>
  );
}

// ── 메인 모달 ────────────────────────────────────────────────
export default function TextImportModal({ onClose, onImport }: TextImportModalProps) {
  const [step, setStep]       = useState<'input' | 'confirm'>('input');
  const [text, setText]       = useState('');
  const [parsedItems, setParsedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res  = await fetch('/api/agents/parser-agent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText: text }),
      });
      const data = await res.json() as { items?: CartItem[]; error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? '분석 중 오류가 발생했습니다.');
        return;
      }
      if (!data.items || data.items.length === 0) {
        setError('파싱 가능한 상품을 찾지 못했습니다. 더 구체적인 텍스트를 입력해주세요.');
        return;
      }

      setParsedItems(data.items);
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl px-5 pt-5 pb-8 shadow-xl">
        {/* 드래그 핸들 (모바일) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />

        {step === 'input' ? (
          <StepInput
            text={text}
            setText={setText}
            loading={loading}
            error={error}
            onAnalyze={handleAnalyze}
            onClose={onClose}
          />
        ) : (
          <StepConfirm
            items={parsedItems}
            setItems={setParsedItems}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
