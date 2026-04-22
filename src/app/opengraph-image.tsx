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
        {/* 로고 — 3네모 겹침 */}
        <div
          style={{
            position:     'relative',
            width:        '240px',
            height:       '190px',
            marginBottom: '40px',
            display:      'flex',
          }}
        >
          <div style={{ position: 'absolute', left: 0,   top: 80,  width: 140, height: 140, background: 'rgba(79,70,229,0.55)', borderRadius: 32 }} />
          <div style={{ position: 'absolute', left: 50,  top: 0,   width: 140, height: 140, background: 'rgba(79,70,229,0.55)', borderRadius: 32 }} />
          <div style={{ position: 'absolute', left: 100, top: 80,  width: 140, height: 140, background: 'rgba(79,70,229,0.55)', borderRadius: 32 }} />
        </div>

        <div
          style={{
            fontSize:      '88px',
            fontWeight:    800,
            color:         '#1F2937',
            letterSpacing: '-0.04em',
            marginBottom:  '16px',
          }}
        >
          NEMOA
        </div>

        <div
          style={{
            fontSize:      '36px',
            fontWeight:    500,
            color:         '#4B5563',
            letterSpacing: '-0.02em',
          }}
        >
          일상을 반듯하게 모으다
        </div>

        <div
          style={{
            marginTop: '40px',
            fontSize:  '24px',
            color:     '#6B7280',
          }}
        >
          스마트 냉장고 · 스마트 옷장 · AI 라이프스타일 비서
        </div>
      </div>
    ),
    { ...size },
  );
}
