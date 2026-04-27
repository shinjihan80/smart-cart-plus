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
        {/* 좌상단 빨강 */}
        <div
          style={{
            position:     'absolute',
            left:         '14px',
            top:          '14px',
            width:        '98px',
            height:       '98px',
            background:   '#EE5454',
            borderRadius: '20px',
          }}
        />
        {/* 우하단 파랑 */}
        <div
          style={{
            position:     'absolute',
            left:         '68px',
            top:          '68px',
            width:        '98px',
            height:       '98px',
            background:   '#4263EB',
            borderRadius: '20px',
          }}
        />
        {/* 겹침 잉크 */}
        <div
          style={{
            position:     'absolute',
            left:         '68px',
            top:          '68px',
            width:        '44px',
            height:       '44px',
            background:   '#2D2748',
            borderRadius: '8px',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
