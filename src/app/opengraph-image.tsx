import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'NEMOA — 일상을 반듯하게 모으다';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          background:     '#F4F6F9',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '80px',
        }}
      >
        {/* 로고 — 빨강+파랑 겹침 */}
        <div
          style={{
            position:     'relative',
            width:        '200px',
            height:       '200px',
            marginBottom: '40px',
            display:      'flex',
          }}
        >
          <div style={{ position: 'absolute', left: 0,   top: 0,   width: 130, height: 130, background: '#1F1F2E', borderRadius: 28 }} />
          <div style={{ position: 'absolute', left: 70,  top: 70,  width: 130, height: 130, background: '#4F46E5', borderRadius: 28 }} />
          <div style={{ position: 'absolute', left: 70,  top: 70,  width: 60,  height: 60,  background: '#0A0A18', borderRadius: 12 }} />
        </div>

        <div style={{ fontSize: '88px', fontWeight: 900, color: '#1F1F2E', letterSpacing: '-0.05em', marginBottom: '16px' }}>
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
