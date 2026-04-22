import { ImageResponse } from 'next/og';

// 180x180 iOS apple-touch-icon — 홈 화면 추가 시 사용
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:       '100%',
          height:      '100%',
          background:  '#F9FAFB',
          borderRadius: '40px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          position:     'relative',
        }}
      >
        <div
          style={{
            position:     'absolute',
            width:        '78px',
            height:       '78px',
            background:   '#4F46E5',
            opacity:      0.22,
            borderRadius: '18px',
            transform:    'translate(-22px, 4px) rotate(-8deg)',
          }}
        />
        <div
          style={{
            position:     'absolute',
            width:        '78px',
            height:       '78px',
            background:   '#4F46E5',
            borderRadius: '20px',
            transform:    'translate(22px, 4px)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
