/**
 * Camera Permission & Device Media Utility
 */

export interface CameraPermissionResult {
  success: boolean;
  state: 'granted' | 'denied' | 'prompt' | 'unavailable' | 'error';
  errorMessage?: string;
}

/**
 * Check existing camera permission status if Supported by browser
 */
export async function getCameraPermissionState(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unknown';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as unknown as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'unknown';
  }
}

/**
 * Trigger the native browser prompt to request camera permissions
 */
export async function requestCameraAccess(): Promise<CameraPermissionResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      success: false,
      state: 'unavailable',
      errorMessage: '현재 브라우저에서는 카메라 기능을 지원하지 않거나 보안 연결(HTTPS)이 필요합니다.',
    };
  }

  try {
    // Try requesting environment (rear) camera first, fallback to any video
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    }

    // Stop all active tracks immediately so we don't hold the camera lock
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // ignore
      }
    });

    return {
      success: true,
      state: 'granted',
    };
  } catch (err: unknown) {
    console.warn('[CameraService] Permission request failed:', err);
    const errorStr = err instanceof Error ? err.name : String(err);

    if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDeniedError')) {
      return {
        success: false,
        state: 'denied',
        errorMessage: '카메라 접근 권한이 거부되었습니다. 브라우저 사이트 설정에서 카메라 권한을 허용해주세요.',
      };
    }

    if (errorStr.includes('NotFoundError') || errorStr.includes('DevicesNotFoundError')) {
      return {
        success: false,
        state: 'unavailable',
        errorMessage: '기기에서 사용 가능한 카메라 장치를 찾을 수 없습니다.',
      };
    }

    return {
      success: false,
      state: 'error',
      errorMessage: '카메라를 초기화하는 중 오류가 발생했습니다. 권한 설정을 확인해주세요.',
    };
  }
}
