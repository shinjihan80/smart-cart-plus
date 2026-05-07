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
          background:   '#FFFFFF',
          borderRadius: '40px',
          position:     'relative',
          display:      'flex',
        }}
      >
        {/* 좌상단 검정(잉크) */}
        <div
          style={{
            position:     'absolute',
            left:         '14px',
            top:          '14px',
            width:        '98px',
            height:       '98px',
            background:   '#1F1F2E',
            borderRadius: '20px',
          }}
        />
        {/* 우하단 인디고 */}
        <div
          style={{
            position:     'absolute',
            left:         '68px',
            top:          '68px',
            width:        '98px',
            height:       '98px',
            background:   '#4F46E5',
            borderRadius: '20px',
          }}
        />
        {/* 겹침 — 깊은 검정 */}
        <div
          style={{
            position:     'absolute',
            left:         '68px',
            top:          '68px',
            width:        '44px',
            height:       '44px',
            background:   '#0A0A18',
            borderRadius: '8px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
