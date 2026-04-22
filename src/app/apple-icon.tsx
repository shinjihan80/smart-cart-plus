import { ImageResponse } from 'next/og';

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
          position:     'relative',
          display:      'flex',
        }}
      >
        {/* 외곽 큰 네모 — 프레임 */}
        <div
          style={{
            position:     'absolute',
            left:         '22px',
            top:          '22px',
            width:        '136px',
            height:       '136px',
            border:       '10px solid #4F46E5',
            borderRadius: '28px',
          }}
        />
        {/* 내부 A — indigo solid (왼쪽 위) */}
        <div
          style={{
            position:     'absolute',
            left:         '46px',
            top:          '46px',
            width:        '60px',
            height:       '60px',
            background:   '#4F46E5',
            borderRadius: '12px',
          }}
        />
        {/* 내부 B — pink accent (오른쪽 아래, 겹침) */}
        <div
          style={{
            position:     'absolute',
            left:         '74px',
            top:          '74px',
            width:        '60px',
            height:       '60px',
            background:   'rgba(236,72,153,0.92)',
            borderRadius: '12px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
