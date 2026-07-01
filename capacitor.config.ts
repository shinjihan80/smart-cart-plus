import type { CapacitorConfig } from '@capacitor/cli';

const isProd = process.env.NODE_ENV === 'production';

const config: CapacitorConfig = {
  appId:   'com.nemoa.app',
  appName: 'NEMOA',
  // Next.js API 라우트를 유지하기 위해 원격 서버 방식 사용
  // 빌드 시에는 Vercel 프로덕션 URL, 개발 시에는 로컬 포트
  webDir: 'out',          // npx next build && npx next export 경로 (정적 페이지용)
  server: {
    // 프로덕션 앱: 배포된 Vercel URL을 WebView로 로드
    // → API 라우트(AI·admin·sync)가 서버에서 계속 동작
    url: isProd
      ? 'https://nemoa.vercel.app'
      : 'http://localhost:3000',
    cleartext: false,
    allowNavigation: ['nemoa.vercel.app', '*.supabase.co'],
  },
  ios: {
    contentInset:         'automatic',
    preferredContentMode: 'mobile',
    backgroundColor:      '#F4F6F9',
    scheme:               'nemoa',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#F4F6F9',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // 프로덕션에서 OFF
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // 사진 촬영 직후 편집 허용 (iOS)
      allowEditing: false,
      resultType:   'base64',
      quality:      80,
    },
    StatusBar: {
      overlaysWebView: true,
      style:           'DEFAULT',
      backgroundColor: '#F4F6F9',
    },
    SplashScreen: {
      launchShowDuration:    1000,
      backgroundColor:       '#F4F6F9',
      androidSplashResourceName: 'splash',
      showSpinner:           false,
    },
  },
};

export default config;
