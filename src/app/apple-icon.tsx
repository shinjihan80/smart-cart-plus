import { ImageResponse } from 'next/og';

// 180x180 iOS apple-touch-icon — 홈 화면 추가 시 사용
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:        '100%',
          height:       '100%',
          background:   '#F9FAFB',
          borderRadius: '40px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          position:     'relative',
        }}
      >
        {/* 외곽 네모 — 아웃라인 */}
        <div
          style={{
            position:     'absolute',
            width:        '120px',
            height:       '120px',
            border:       '10px solid #4F46E5',
            borderRadius: '28px',
          }}
        />
        {/* 내부 네모 — 솔리드 */}
        <div
          style={{
            width:        '48px',
            height:       '48px',
            background:   '#4F46E5',
            borderRadius: '10px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
