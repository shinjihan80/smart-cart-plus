'use client';

import { isNative } from './index';

export interface NetworkStatus {
  connected:       boolean;
  connectionType:  'wifi' | 'cellular' | 'none' | 'unknown';
}

/** 현재 네트워크 상태 조회 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (isNative()) {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return {
      connected:      status.connected,
      connectionType: status.connectionType as NetworkStatus['connectionType'],
    };
  }
  return {
    connected:      navigator.onLine,
    connectionType: navigator.onLine ? 'unknown' : 'none',
  };
}

/** 네트워크 상태 변경 리스너 */
export async function onNetworkChange(cb: (status: NetworkStatus) => void): Promise<() => void> {
  if (isNative()) {
    const { Network } = await import('@capacitor/network');
    const handle = await Network.addListener('networkStatusChange', (s) => {
      cb({ connected: s.connected, connectionType: s.connectionType as NetworkStatus['connectionType'] });
    });
    return () => handle.remove();
  }
  const handler = () => cb({ connected: navigator.onLine, connectionType: navigator.onLine ? 'unknown' : 'none' });
  window.addEventListener('online',  handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online',  handler);
    window.removeEventListener('offline', handler);
  };
}
