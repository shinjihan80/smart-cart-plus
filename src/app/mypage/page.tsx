import { User } from 'lucide-react';

export default function MyPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 px-4">
      <User size={48} strokeWidth={1.5} className="text-indigo-300 mb-4" />
      <h2 className="text-lg font-bold text-gray-800 mb-1">마이페이지</h2>
      <p className="text-sm text-center">사용자 및 패밀리 관리 기능이 곧 추가됩니다</p>
      <p className="text-xs text-center mt-1">통계, 설정, 알림 관리를 제공할 예정이에요.</p>
    </div>
  );
}
