'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceDetection } from '@/lib/proctoring/useFaceDetection';
import type { FaceDetectionEngine } from '@/lib/proctoring/FaceDetectionEngine';
import type { DetectionResult } from '@/lib/proctoring/types';

interface CameraCheckWidgetProps {
  stream: MediaStream | null;
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
  cameraError?: string | null;
  onProceed: () => void;
  onRetryCamera: () => void;
}

export function CameraCheckWidget({
  stream,
  cameraStatus,
  cameraError,
  onProceed,
  onRetryCamera,
}: CameraCheckWidgetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FaceDetectionEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [latestResult, setLatestResult] = useState<DetectionResult | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const { faceDetected, faceCount, lightingOk, isInitialized } = useFaceDetection({
    videoRef,
    active: cameraStatus === 'active' && engineReady,
  });

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Lazy-load face detection engine
  useEffect(() => {
    if (cameraStatus !== 'active') return;

    import('@/lib/proctoring').then(({ faceEngine }) => {
      engineRef.current = faceEngine;
      faceEngine.loadModel().then(() => setEngineReady(true)).catch(() => {});
    });
  }, [cameraStatus]);

  // Detection loop for bounding box drawing
  const runBBoxDetection = useCallback(async () => {
    if (!videoRef.current || !engineRef.current?.isReady()) return;

    try {
      const result = await engineRef.current.detect(videoRef.current);
      setLatestResult(result);

      if (canvasRef.current && videoRef.current) {
        engineRef.current.drawBoundingBoxes(
          canvasRef.current,
          result,
          videoRef.current.videoWidth || 640,
          videoRef.current.videoHeight || 480
        );
      }
    } catch {
      // Detection failed — will retry on next interval
    }

    detectionIntervalRef.current = window.setTimeout(runBBoxDetection, 2000);
  }, []);

  useEffect(() => {
    if (engineReady && cameraStatus === 'active') {
      detectionIntervalRef.current = window.setTimeout(runBBoxDetection, 800);
    }
    return () => {
      if (detectionIntervalRef.current) clearTimeout(detectionIntervalRef.current);
    };
  }, [engineReady, cameraStatus, runBBoxDetection]);

  const allChecksPass = cameraStatus === 'active' && faceCount === 1 && lightingOk;

  // Camera permission denied state
  if (cameraStatus === 'denied' || cameraStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-8">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4">
            <CameraOff className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Camera access required</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
            {cameraError || 'Camera access was denied. This contest requires camera for proctoring.'}
          </p>

          <ol className="text-xs text-muted-foreground space-y-1.5 mb-5 text-left">
            <li>1. Click the camera icon in your browser address bar</li>
            <li>2. Select &quot;Allow&quot; for camera access</li>
            <li>3. Click &quot;Retry Camera&quot; below</li>
          </ol>

          <Button onClick={onRetryCamera} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Camera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative mx-auto overflow-hidden rounded-xl bg-black" style={{ width: 280, height: 210 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={280}
          height={210}
        />

        {/* Loading overlay */}
        {(cameraStatus === 'requesting' || (cameraStatus === 'active' && !engineReady)) && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-white animate-spin mx-auto mb-2" />
              <p className="text-xs text-white/80">
                {cameraStatus === 'requesting' ? 'Starting camera...' : 'Loading face detection...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Checklist */}
      <div className="space-y-2">
        {/* Camera Status */}
        <StatusRow
          ok={cameraStatus === 'active'}
          warning={false}
          okText="Camera active"
          warningText=""
          errorText="Camera not active"
        />

        {/* Face Detection */}
        <StatusRow
          ok={faceCount === 1}
          warning={faceCount === 0 && cameraStatus === 'active'}
          okText="Face detected"
          warningText="No face detected — center your face"
          errorText={faceCount >= 2 ? 'Multiple faces detected — only you should be visible' : 'No face detected'}
        />

        {/* Lighting */}
        <StatusRow
          ok={lightingOk}
          warning={!lightingOk && cameraStatus === 'active'}
          okText="Lighting OK"
          warningText="Too dark — improve lighting or move to brighter area"
          errorText="Lighting too low"
        />
      </div>

      {/* Proceed Button */}
      <Button
        onClick={onProceed}
        disabled={!allChecksPass}
        className="w-full h-[52px] text-base font-semibold"
        title={!allChecksPass ? 'Fix camera issues above before proceeding' : undefined}
      >
        {allChecksPass ? 'Proceed to Quiz' : 'Fix issues above to proceed'}
      </Button>
    </div>
  );
}

// ─── Status Row Component ────────────────────────────────

function StatusRow({
  ok,
  warning,
  okText,
  warningText,
  errorText,
}: {
  ok: boolean;
  warning: boolean;
  okText: string;
  warningText: string;
  errorText: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      {ok ? (
        <>
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">{okText}</span>
        </>
      ) : warning ? (
        <>
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{warningText}</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">{errorText}</span>
        </>
      )}
    </div>
  );
}
