import { ImageResponse } from 'next/og';
import { brandIconDataUri } from '@/lib/brandIcon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brandIconDataUri(true)} alt="NEMOA" width={180} height={180} />
      </div>
    ),
    { ...size },
  );
}
