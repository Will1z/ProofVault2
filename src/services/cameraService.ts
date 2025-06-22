interface CameraCapture {
  blob: Blob;
  type: 'image' | 'video';
  duration?: number;
  metadata: {
    timestamp: Date;
    location?: { lat: number; lng: number };
    device?: string;
  };
}

interface CameraConstraints {
  video: {
    width?: { ideal: number };
    height?: { ideal: number };
    facingMode?: 'user' | 'environment';
    frameRate?: { ideal: number };
  };
  audio?: boolean;
}

class CameraService {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  async requestCameraAccess(constraints: CameraConstraints = {
    video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
    audio: true
  }): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      console.error('Camera access denied:', error);
      throw new Error('Camera access denied. Please allow camera permissions.');
    }
  }

  async capturePhoto(): Promise<CameraCapture> {
    if (!this.stream) {
      throw new Error('Camera not initialized. Call requestCameraAccess() first.');
    }

    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.play();

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to capture photo'));
            return;
          }

          // Get location if available
          let location: { lat: number; lng: number } | undefined;
          try {
            if (navigator.geolocation) {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 5000,
                });
              });
              location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
            }
          } catch (error) {
            console.log('Location not available for photo');
          }

          resolve({
            blob,
            type: 'image',
            metadata: {
              timestamp: new Date(),
              location,
              device: navigator.userAgent,
            },
          });
        }, 'image/jpeg', 0.9);
      };
    });
  }

  async startVideoRecording(): Promise<void> {
    if (!this.stream) {
      throw new Error('Camera not initialized. Call requestCameraAccess() first.');
    }

    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.recordedChunks = [];
    
    const options = {
      mimeType: 'video/webm;codecs=vp9,opus',
    };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (error) {
      // Fallback to default codec
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Collect data every second
    this.isRecording = true;
  }

  async stopVideoRecording(): Promise<CameraCapture> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No recording in progress');
    }

    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();

      this.mediaRecorder!.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const duration = (Date.now() - startTime) / 1000;

        // Get location if available
        let location: { lat: number; lng: number } | undefined;
        try {
          if (navigator.geolocation) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
              });
            });
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
          }
        } catch (error) {
          console.log('Location not available for video');
        }

        resolve({
          blob,
          type: 'video',
          duration,
          metadata: {
            timestamp: new Date(),
            location,
            device: navigator.userAgent,
          },
        });
      };

      this.mediaRecorder!.onerror = (event) => {
        reject(new Error('Recording failed'));
      };

      this.mediaRecorder!.stop();
      this.isRecording = false;
    });
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isRecording = false;
  }

  isRecordingVideo(): boolean {
    return this.isRecording;
  }

  isCameraActive(): boolean {
    return !!this.stream;
  }

  async switchCamera(facingMode: 'user' | 'environment'): Promise<MediaStream> {
    this.stopCamera();
    return await this.requestCameraAccess({
      video: { 
        width: { ideal: 1920 }, 
        height: { ideal: 1080 }, 
        facingMode 
      },
      audio: true
    });
  }
}

export const cameraService = new CameraService();
export type { CameraCapture, CameraConstraints };