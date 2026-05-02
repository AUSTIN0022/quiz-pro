'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { FaceDetectionEngine } from './FaceDetectionEngine';
import { useProctoringStore } from '@/lib/stores/proctoring-store';

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  active: boolean;
}

export function useFaceDetection({ videoRef, active }: UseFaceDetectionProps) {
  const engine = FaceDetectionEngine.getInstance();
  const proctoringStore = useProctoringStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const detectionIntervalRef = useRef<number | null>(null);
  const noFaceCountRef = useRef(0);
  const multipleFaceCountRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Initialize model on first mount
  useEffect(() => {
    const initModel = async () => {
      try {
        await engine.loadModel();
        setIsInitialized(true);
      } catch (error) {
        console.error('[v0] Failed to initialize face detection:', error);
      }
    };

    if (active && !isInitialized) {
      initModel();
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, isInitialized, engine]);

  // Main detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !isInitialized) return;

    try {
      const result = await engine.detect(videoRef.current);

      // Update face count
      proctoringStore.setFaceCount(result.faceCount);
      proctoringStore.setFaceDetected(result.faceCount === 1);

      // Update brightness
      if (result.brightness < 40) {
        proctoringStore.setLightingOk(false);
      } else {
        proctoringStore.setLightingOk(true);
      }

      // Handle no face detected (> 5s)
      if (result.faceCount === 0) {
        noFaceCountRef.current++;
        multipleFaceCountRef.current = 0;

        if (noFaceCountRef.current > 2.5) {
          // ~5s at 2s intervals
          console.log('[v0] No face detected for 5+ seconds');
          // Emit warning will be handled by parent component
          noFaceCountRef.current = 0;
        }
      } else if (result.faceCount === 1) {
        noFaceCountRef.current = 0;
        multipleFaceCountRef.current = 0;
      } else if (result.faceCount >= 2) {
        // Multiple faces detected (> 3s)
        multipleFaceCountRef.current++;
        noFaceCountRef.current = 0;

        if (multipleFaceCountRef.current > 1.5) {
          // ~3s at 2s intervals
          console.log('[v0] Multiple faces detected for 3+ seconds');
          // Emit warning will be handled by parent component
          multipleFaceCountRef.current = 0;
        }
      }
    } catch (error) {
      console.error('[v0] Detection error:', error);
    }

    // Schedule next detection (every 2 seconds)
    detectionIntervalRef.current = window.setTimeout(runDetection, 2000);
  }, [videoRef, isInitialized, engine, proctoringStore]);

  // Start/stop detection based on active prop
  useEffect(() => {
    if (active && isInitialized) {
      // Start detection immediately
      detectionIntervalRef.current = window.setTimeout(runDetection, 500);
    } else {
      // Stop detection
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
      }
    };
  }, [active, isInitialized, runDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    isInitialized,
    faceCount: proctoringStore.faceCount,
    faceDetected: proctoringStore.faceDetected,
    lightingOk: proctoringStore.lightingOk,
  };
}
