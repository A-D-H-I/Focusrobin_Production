/**
 * Type declarations for MediaPipe packages
 * @see https://google.github.io/mediapipe/
 */

declare module "@mediapipe/face_mesh" {
  export interface FaceMeshOptions {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z?: number;
    visibility?: number;
  }

  export interface Results {
    multiFaceLandmarks?: NormalizedLandmark[][];
    image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
  }

  export interface FaceMeshConfig {
    locateFile?: (file: string) => string;
  }

  export class FaceMesh {
    constructor(config?: FaceMeshConfig);
    setOptions(options: FaceMeshOptions): Promise<void>;
    onResults(callback: (results: Results) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
    reset(): void;
  }
}

declare module "@mediapipe/camera_utils" {
  export interface CameraOptions {
    onFrame: () => Promise<void>;
    width?: number;
    height?: number;
    facingMode?: string;
  }

  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      options: CameraOptions
    );
    start(): Promise<void>;
    stop(): void;
  }
}

declare module "@mediapipe/drawing_utils" {
  import { NormalizedLandmark } from "@mediapipe/face_mesh";

  export interface DrawingOptions {
    color?: string;
    lineWidth?: number;
    fillColor?: string;
    radius?: number;
  }

  export interface Connection {
    start: number;
    end: number;
  }

  export function drawConnectors(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    connections: Connection[] | number[][],
    options?: DrawingOptions
  ): void;

  export function drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: NormalizedLandmark[],
    options?: DrawingOptions
  ): void;
}



























