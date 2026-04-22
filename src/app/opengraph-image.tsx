import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'NEMOA — 일상을 반듯하게 모으다';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:        '100%',
          height:       '100%',
          background:   'linear-gradient(135deg, #F9FAFB 0%, #EEF2FF 100%)',
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          justifyContent: 'center',
          padding:      '80px',
        }}
      >
        {/* 로고 — 큰 네모 안에 색 다른 두 네모 겹침 */}
        <div
          style={{
            position:     'relative',
            width:        '200px',
            height:       '200px',
            marginBottom: '40px',
            display:      'flex',
          }}
        >
          {/* 외곽 프레임 */}
          <div style={{ position: 'absolute', inset: 0, border: '12px solid #4F46E5', borderRadius: 40 }} />
          {/* 내부 A — indigo */}
          <div style={{ position: 'absolute', left: 36, top: 36, width: 90, height: 90, background: '#4F46E5', borderRadius: 16 }} />
          {/* 내부 B — pink */}
          <div style={{ position: 'absolute', left: 74, top: 74, width: 90, height: 90, background: 'rgba(236,72,153,0.92)', borderRadius: 16 }} />
        </div>

        <div style={{ fontSize: '88px', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.04em', marginBottom: '16px' }}>
          NEMOA
        </div>

        <div style={{ fontSize: '36px', fontWeight: 500, color: '#4B5563', letterSpacing: '-0.02em' }}>
          일상을 반듯하게 모으다
        </div>

        <div style={{ marginTop: '40px', fontSize: '24px', color: '#6B7280' }}>
          스마트 냉장고 · 스마트 옷장 · AI 라이프스타일 비서
        </div>
      </div>
    ),
    { ...size },
  );
}
