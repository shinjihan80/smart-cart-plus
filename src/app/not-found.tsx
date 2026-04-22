import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="relative mb-6 flex items-center">
        <div
          className="w-16 h-16 rounded-[18px] bg-brand-primary/20 absolute -translate-x-4 -rotate-6"
          aria-hidden
        />
        <div
          className="w-16 h-16 rounded-[20px] bg-brand-primary relative"
          aria-hidden
        />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
        찾는 페이지가 네모 밖이에요
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-[280px] leading-relaxed">
        요청하신 페이지가 없거나 이동됐어요. 홈에서 ⌘K로 빠르게 찾아보세요.
      </p>
      <div className="flex gap-2">
        <Link
          href="/"
          className="rounded-2xl bg-brand-primary text-white text-sm font-semibold px-6 py-2.5 hover:opacity-90 active:scale-95 transition-all"
        >
          홈으로 가기
        </Link>
        <Link
          href="/fridge"
          className="rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold px-6 py-2.5 hover:bg-gray-50 active:scale-95 transition-all"
        >
          냉장고
        </Link>
      </div>
    </div>
  );
}
