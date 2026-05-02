'use client';

import { useEffect, useRef } from 'react';

interface CameraFeedProps {
  stream: MediaStream | null;
  variant?: 'floating' | 'preview' | 'check';
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  boundingBoxes?: Array<{ x: number; y: number; width: number; height: number }>;
  faceDetected?: boolean;
}

export function CameraFeed({
  stream,
  variant = 'floating',
  onCanvasReady,
  boundingBoxes,
  faceDetected,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((error) => {
      console.error('[v0] Failed to play video:', error);
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  // Draw bounding boxes on canvas
  useEffect(() => {
    if (variant !== 'check' || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (boundingBoxes && boundingBoxes.length > 0) {
        boundingBoxes.forEach((box) => {
          ctx.strokeStyle = faceDetected ? '#22c55e' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
        });
      }

      if (onCanvasReady && !onCanvasReady.called) {
        onCanvasReady(canvas);
        (onCanvasReady as any).called = true;
      }

      requestAnimationFrame(draw);
    };

    draw();
  }, [boundingBoxes, faceDetected, variant, onCanvasReady]);

  const variantClasses = {
    floating: 'w-20 h-16 rounded-md shadow-lg z-40',
    preview: 'w-70 h-52 rounded-lg',
    check: 'w-80 h-60 rounded-lg',
  };

  return (
    <div className={`relative bg-surface overflow-hidden ${variantClasses[variant]}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      {variant === 'check' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={320}
          height={240}
        />
      )}
    </div>
  );
}
