import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없어요</h2>
      <p className="text-sm text-gray-500 mb-6">
        요청하신 페이지가 존재하지 않거나 이동됐어요.
      </p>
      <Link
        href="/"
        className="rounded-2xl bg-brand-primary text-white text-sm font-semibold px-6 py-2.5 hover:opacity-90 active:scale-95 transition-all"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
