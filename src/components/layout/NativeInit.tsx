'use client';

import { useEffect } from 'react';
import { isNative, IS_IOS } from '@/lib/native';

/**
 * 앱 최초 로드 시 네이티브 환경 초기화.
 * - iOS StatusBar: 배경색·스타일 설정
 * - Android NavigationBar: 테마 색상 적용
 * - 푸시 수신 리스너 연결
 */
export default function NativeInit() {
  useEffect(() => {
    if (!isNative()) return;
    void initNative();
  }, []);

  return null;
}

async function initNative() {
  // StatusBar 설정
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#F4F6F9' });
    if (IS_IOS) {
      await StatusBar.setOverlaysWebView({ overlay: true });
    }
  } catch { /* 환경에 따라 플러그인 미지원 가능 */ }

  // 푸시 알림 수신 리스너
  try {
    const { listenPushReceived } = await import('@/lib/native/push');
    await listenPushReceived((title, body) => {
      // 포그라운드 인앱 알림 처리 — 커스텀 Toast 이벤트로 전달
      window.dispatchEvent(new CustomEvent('nemoa:push', { detail: { title, body } }));
    });
  } catch { /* 무시 */ }
}
