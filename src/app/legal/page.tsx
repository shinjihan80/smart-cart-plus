'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

/**
 * 이용약관 + 개인정보 처리방침을 한 페이지에 병렬 노출.
 * 앱 스토어·PWA 등록 시 링크 필수 — 별도 경로 유지.
 */
export default function LegalPage() {
  const updatedAt = '2026-09-20';
  const router = useRouter();

  // 이전 경로로 복귀 — 설정·AppInfo·ConsentGate 등 어디서 왔든 자연스럽게.
  // 직접 URL로 들어왔으면 홈으로 폴백.
  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  return (
    <div>
      <header className="sticky top-0 w-screen ml-[calc(50%-50vw)] z-20 bg-white/95 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-md min-[700px]:max-w-[680px] min-[1000px]:max-w-[880px] mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="뒤로"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">약관 및 개인정보</h1>
            <p className="text-sm text-gray-400 mt-0.5">최종 업데이트 {updatedAt}</p>
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-6 flex flex-col gap-8 text-sm text-gray-700 leading-relaxed"
      >
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">이용약관</h2>
          <div className="flex flex-col gap-3 text-[13px]">
            <p>
              <strong>제1조 (목적)</strong><br />
              본 약관은 NEMOA(이하 &ldquo;서비스&rdquo;)가 제공하는 생활 관리 보조 기능의 이용 조건을 규정합니다.
            </p>
            <p>
              <strong>제2조 (서비스 내용)</strong><br />
              식품·의류 정보 관리, AI 기반 레시피·코디 추천, 제철 재료 안내, 데이터 백업 등 라이프스타일 도구를 제공합니다.
              서비스는 &ldquo;있는 그대로&rdquo; 제공되며, AI 추천·영양 추정·보관 기간 등은 참고용이며 보장되지 않습니다.
            </p>
            <p>
              <strong>제3조 (이용자 책임)</strong><br />
              이용자는 본인이 입력·업로드하는 정보(사진·텍스트)에 대한 권리를 본인이 보유해야 합니다.
              타인의 이미지나 저작권 보호 텍스트를 무단으로 업로드해서는 안 됩니다.
            </p>
            <p>
              <strong>제4조 (면책)</strong><br />
              서비스는 식품의 안전성, 의류의 적합성, 제휴 업체의 상품 정보 정확성에 대해 책임지지 않습니다.
              보관 기한을 초과한 식품의 섭취나 AI 추천에 따른 결과는 이용자의 판단과 책임입니다.
            </p>
            <p>
              <strong>제5조 (약관 변경)</strong><br />
              약관은 공지 후 7일 경과 시 효력이 발생합니다. 주요 변경 시에는 앱 내 알림으로 안내합니다.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">개인정보 처리방침</h2>
          <div className="flex flex-col gap-3 text-[13px]">
            <p>
              <strong>1. 수집하는 정보</strong><br />
              NEMOA는 서버에 개인정보를 저장하지 않습니다. 이용자가 입력한 모든 정보(식품·의류 목록,
              프로필, 착용·조리 로그, 사진 등)는 <strong>이용자 기기의 브라우저 localStorage에만 저장</strong>됩니다.
            </p>
            <p>
              <strong>2. AI 분석 요청</strong><br />
              사용자가 명시적으로 &ldquo;사진 분석&rdquo;, &ldquo;텍스트 파싱&rdquo; 등의 AI 기능을 실행할 때에 한해
              Google Gemini API에 데이터가 전송됩니다. 전송된 데이터는 분석 결과 반환 후 Google의
              정책에 따라 처리·파기됩니다. (Google AI 개인정보 정책 참조)
            </p>
            <p>
              <strong>3. 날씨 정보</strong><br />
              위치 권한을 요청하지 않습니다. 날씨는 서울 기준 고정 좌표로 Open-Meteo 기상 API에서
              조회하며, 이용자의 실제 위치 정보는 수집·전송하지 않습니다.
            </p>
            <p>
              <strong>4. 제3자 제공</strong><br />
              NEMOA는 이용자 데이터를 제3자에게 판매하거나 공유하지 않습니다.
              Phase 7 파트너(쇼핑몰·중고·기부 업체)와 연결 시에도 사용자 데이터는 이동하지 않으며,
              사용자가 직접 파트너 웹사이트로 이동하는 방식만 제공됩니다.
            </p>
            <p>
              <strong>5. 광고·통계·쿠키</strong><br />
              모바일 앱(iOS/Android)에는 무료 이용을 지원하기 위해 Google AdMob 보상형(리워드) 영상
              광고가 제한적으로 노출됩니다(하루 최대 2회, 5분 쿨다운). 광고 SDK 특성상 기기 광고 식별자가
              Google에 전달될 수 있으며, 처리 방식은 Google의 개인정보처리방침을 따릅니다. 웹(브라우저)
              버전에는 광고가 없습니다. 설정 → 피드백의 &ldquo;익명 사용 통계&rdquo;는 <strong>기본값이
              꺼짐(opt-in)</strong>인 기능으로, 사용자가 직접 켠 경우에만 식별자 없는 하루 단위 토큰으로
              세션·오류 발생 여부 등을 집계 서버로 전송합니다(이름·기기 고유 식별자 수집 없음). 꺼진
              상태에서는 이 설정값 자체만 기기에 저장될 뿐 외부로 아무것도 전송되지 않습니다. 그 외
              localStorage는 앱 기능(등록 목록·설정값 등) 유지 목적으로만 사용합니다.
            </p>
            <p>
              <strong>6. 데이터 삭제</strong><br />
              이용자는 언제든 설정 → &ldquo;전체 데이터 초기화&rdquo;로 본인의 모든 데이터를 삭제할 수 있으며,
              브라우저의 사이트 데이터 지우기로도 완전 삭제됩니다.
            </p>
            <p>
              <strong>7. 문의</strong><br />
              개인정보 처리 관련 문의는 앱 내 피드백 또는 개발자 이메일로 연락해 주세요.
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 p-4">
          <p className="text-[12px] text-gray-700 leading-relaxed">
            💡 <strong>요약</strong>: 서버에 데이터가 남지 않아요.
            모든 기록은 이 기기의 브라우저 안에만 있어요.
            AI 분석을 요청할 때만 그 순간 Google Gemini 서버로 전송되고, Google 정책에 따라 처리·파기됩니다.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
