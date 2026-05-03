'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

interface UseCameraStreamReturn {
  stream: MediaStream | null;
  status: CameraStatus;
  errorMessage: string | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useCameraStream(): UseCameraStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setStatus('idle');
  }, []);

  const requestCamera = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setStatus('active');
    } catch (err: unknown) {
      const error = err as DOMException;

      if (error.name === 'NotAllowedError') {
        setStatus('denied');
        setErrorMessage(
          'Camera access was denied. Please allow camera in browser settings.'
        );
      } else if (error.name === 'NotFoundError') {
        setStatus('error');
        setErrorMessage('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        setStatus('error');
        setErrorMessage(
          'Camera is already in use by another application.'
        );
      } else {
        setStatus('error');
        setErrorMessage(
          'Camera error: ' + (error.message || 'Unknown error')
        );
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { stream, status, errorMessage, requestCamera, stopCamera };
}
