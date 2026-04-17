'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-5xl mb-4">😵</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">문제가 발생했어요</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-[260px] leading-relaxed">
        일시적인 오류예요. 아래 버튼을 눌러 다시 시도해주세요.
      </p>
      <button
        onClick={reset}
        className="rounded-2xl bg-brand-primary text-white text-sm font-semibold px-6 py-2.5 hover:opacity-90 active:scale-95 transition-all"
      >
        다시 시도
      </button>
    </div>
  );
}
