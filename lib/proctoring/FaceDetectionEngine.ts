import * as faceapi from 'face-api.js';

export interface DetectionResult {
  faceCount: number;
  brightness: number;
  boundingBoxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export class FaceDetectionEngine {
  private modelsLoaded = false;
  private static instance: FaceDetectionEngine;

  private constructor() {}

  static getInstance(): FaceDetectionEngine {
    if (!FaceDetectionEngine.instance) {
      FaceDetectionEngine.instance = new FaceDetectionEngine();
    }
    return FaceDetectionEngine.instance;
  }

  async loadModel(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      // Load models from CDN
      const MODEL_URL =
        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

      await faceapi.nets.ssdMobilenetv1.load(MODEL_URL);
      await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.load(MODEL_URL);

      this.modelsLoaded = true;
      console.log('[v0] Face detection models loaded');
    } catch (error) {
      console.error('[v0] Failed to load face detection models:', error);
      throw new Error('Failed to load face detection models');
    }
  }

  async detect(videoElement: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded. Call loadModel() first.');
    }

    try {
      const detections = await faceapi.detectAllFaces(
        videoElement,
        new faceapi.TinyFaceDetectorOptions()
      );

      const brightness = this.calculateBrightness(videoElement);

      const boundingBoxes = detections.map((detection) => {
        const box = detection.detection.box;
        return {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
      });

      return {
        faceCount: detections.length,
        brightness,
        boundingBoxes,
      };
    } catch (error) {
      console.error('[v0] Face detection error:', error);
      return {
        faceCount: 0,
        brightness: 0,
        boundingBoxes: [],
      };
    }
  }

  calculateBrightness(videoElement: HTMLVideoElement): number {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;

      ctx.drawImage(videoElement, 0, 0);

      // Sample pixels from center of frame (100 pixels)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const sampleSize = 50;

      const imageData = ctx.getImageData(
        centerX - sampleSize / 2,
        centerY - sampleSize / 2,
        sampleSize,
        sampleSize
      );

      const data = imageData.data;
      let totalBrightness = 0;
      let pixelCount = 0;

      // Calculate average brightness using luminance formula
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Luminance: 0.299R + 0.587G + 0.114B
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        pixelCount++;
      }

      return pixelCount > 0 ? Math.round(totalBrightness / pixelCount) : 0;
    } catch (error) {
      console.error('[v0] Brightness calculation error:', error);
      return 0;
    }
  }
}
