'use client';

import { isNative } from './index';

export interface CapturedPhoto {
  base64: string;          // data:image/jpeg;base64,... 형태
  dataUrl: string;
}

/**
 * 카메라 촬영 또는 갤러리 선택.
 * - 네이티브: @capacitor/camera 사용 → 고품질 네이티브 UI
 * - 웹: <input type="file" capture="environment"> 폴백
 */
export async function capturePhoto(source: 'camera' | 'photos' = 'camera'): Promise<CapturedPhoto | null> {
  if (isNative()) {
    return captureNative(source);
  }
  return captureWeb();
}

async function captureNative(source: 'camera' | 'photos'): Promise<CapturedPhoto | null> {
  const { Camera, CameraSource, CameraResultType } = await import('@capacitor/camera');
  const photo = await Camera.getPhoto({
    source:     source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
    resultType: CameraResultType.Base64,
    quality:    80,
    allowEditing: false,
  });
  if (!photo.base64String) return null;
  const base64 = photo.base64String;
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  return { base64, dataUrl };
}

function captureWeb(): Promise<CapturedPhoto | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type    = 'file';
    input.accept  = 'image/*';
    input.capture = 'environment';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64  = dataUrl.split(',')[1];
        resolve({ base64, dataUrl });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
