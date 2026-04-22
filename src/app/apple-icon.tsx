import { ImageResponse } from 'next/og';

// 180x180 iOS apple-touch-icon
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
        {/* 3개의 네모가 대각선으로 겹침. rgba로 색 혼합 */}
        <div
          style={{
            position:     'absolute',
            left:         '18px',
            top:          '58px',
            width:        '80px',
            height:       '80px',
            background:   'rgba(79,70,229,0.55)',
            borderRadius: '20px',
          }}
        />
        <div
          style={{
            position:     'absolute',
            left:         '50px',
            top:          '18px',
            width:        '80px',
            height:       '80px',
            background:   'rgba(79,70,229,0.55)',
            borderRadius: '20px',
          }}
        />
        <div
          style={{
            position:     'absolute',
            left:         '82px',
            top:          '58px',
            width:        '80px',
            height:       '80px',
            background:   'rgba(79,70,229,0.55)',
            borderRadius: '20px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
