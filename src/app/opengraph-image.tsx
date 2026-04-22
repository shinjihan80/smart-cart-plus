import { ImageResponse } from 'next/og';

// 카카오톡·트위터·페이스북 공유 시 카드 이미지
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
        {/* 로고 — 두 사각형 겹침 */}
        <div style={{ display: 'flex', position: 'relative', marginBottom: '48px' }}>
          <div
            style={{
              width:        '120px',
              height:       '120px',
              background:   '#4F46E5',
              opacity:      0.22,
              borderRadius: '28px',
              transform:    'rotate(-8deg)',
              marginRight:  '-60px',
            }}
          />
          <div
            style={{
              width:        '120px',
              height:       '120px',
              background:   '#4F46E5',
              borderRadius: '32px',
            }}
          />
        </div>

        <div
          style={{
            fontSize:   '88px',
            fontWeight: 800,
            color:      '#1F2937',
            letterSpacing: '-0.04em',
            marginBottom:  '16px',
          }}
        >
          NEMOA
        </div>

        <div
          style={{
            fontSize:   '36px',
            fontWeight: 500,
            color:      '#4B5563',
            letterSpacing: '-0.02em',
          }}
        >
          일상을 반듯하게 모으다
        </div>

        <div
          style={{
            marginTop:  '48px',
            fontSize:   '24px',
            color:      '#6B7280',
          }}
        >
          🧊 스마트 냉장고 · 👔 스마트 옷장 · 🤖 AI 비서
        </div>
      </div>
    ),
    { ...size },
  );
}
