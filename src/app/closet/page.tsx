import { Shirt } from 'lucide-react';

export default function ClosetPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 px-4">
      <Shirt size={48} strokeWidth={1.5} className="text-indigo-300 mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">스마트 옷장</h2>
      <p className="text-sm text-center">의류·액세서리 관리 기능이 곧 추가됩니다</p>
      <p className="text-xs text-center mt-1">날씨 기반 코디 추천, 소재 관리를 제공할 예정이에요.</p>
    </div>
  );
}
