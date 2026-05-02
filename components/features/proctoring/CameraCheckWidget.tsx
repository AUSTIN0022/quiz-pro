'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { CameraFeed } from './CameraFeed';
import { useFaceDetection } from '@/lib/proctoring/useFaceDetection';
import { FaceDetectionEngine } from '@/lib/proctoring/FaceDetectionEngine';

interface CameraCheckWidgetProps {
  onCameraReady?: (ready: boolean) => void;
  onFaceDetected?: (detected: boolean) => void;
}

export function CameraCheckWidget({
  onCameraReady,
  onFaceDetected,
}: CameraCheckWidgetProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<
    Array<{ x: number; y: number; width: number; height: number }>
  >([]);

  const { faceDetected, faceCount, lightingOk, isInitialized } = useFaceDetection({
    videoRef,
    active: !!stream,
  });

  // Request camera access
  useEffect(() => {
    const requestCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
        });
        setStream(mediaStream);
        setError(null);
        onCameraReady?.(true);

        // Set video ref
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to access camera';
        setError(errorMessage);
        onCameraReady?.(false);
      }
    };

    requestCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCameraReady]);

  // Update parent with face detection status
  useEffect(() => {
    onFaceDetected?.(faceDetected);
  }, [faceDetected, onFaceDetected]);

  // Detect faces and draw bounding boxes
  useEffect(() => {
    if (!isInitialized || !videoRef.current || !stream) return;

    const engine = FaceDetectionEngine.getInstance();
    const detectFaces = async () => {
      try {
        const result = await engine.detect(videoRef.current!);
        setBoundingBoxes(result.boundingBoxes);
      } catch (error) {
        console.error('[v0] Face detection failed:', error);
      }

      requestAnimationFrame(detectFaces);
    };

    detectFaces();
  }, [isInitialized, stream]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-500">Camera access denied</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please enable camera access in your browser settings to continue.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Camera Preview */}
          <div className="flex justify-center">
            <video
              ref={videoRef}
              className="w-80 h-60 rounded-lg bg-black object-cover"
              playsInline
              muted
              autoPlay
            />
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            {/* Camera Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
              {stream && !error ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Camera active
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    Camera denied
                  </span>
                </>
              )}
            </div>

            {/* Face Detection Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
              {faceDetected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Face detected
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">
                    No face detected — adjust position
                  </span>
                </>
              )}
            </div>

            {/* Lighting Status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2">
              {lightingOk ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Lighting OK
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">
                    Too dark — improve lighting
                  </span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
