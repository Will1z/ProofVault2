import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Square, RotateCcw, X, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cameraService, CameraCapture as CameraCaptureType } from '../services/cameraService';
import { weatherService } from '../services/weatherService';
import toast from 'react-hot-toast';

interface CameraCaptureProps {
  onCapture: (capture: CameraCaptureType & { weatherData?: any }) => void;
  onClose: () => void;
  mode?: 'photo' | 'video';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, mode = 'photo' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedMedia, setCapturedMedia] = useState<CameraCaptureType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeCamera();
    return () => {
      cameraService.stopCamera();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await cameraService.requestCameraAccess({
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 }, 
          facingMode 
        },
        audio: mode === 'video'
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Camera access denied. Please allow camera permissions.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = async () => {
    try {
      let capture: CameraCaptureType;
      
      if (mode === 'photo') {
        capture = await cameraService.capturePhoto();
      } else {
        if (isRecording) {
          capture = await cameraService.stopVideoRecording();
          setIsRecording(false);
          setRecordingTime(0);
        } else {
          await cameraService.startVideoRecording();
          setIsRecording(true);
          return;
        }
      }

      // Get weather data for context
      let weatherData;
      if (capture.metadata.location) {
        try {
          weatherData = await weatherService.getWeatherForLocation(
            capture.metadata.location.lat,
            capture.metadata.location.lng
          );
        } catch (error) {
          console.warn('Weather data unavailable:', error);
        }
      }

      setCapturedMedia(capture);
      
      // Auto-upload for emergency situations
      onCapture({ ...capture, weatherData });
      
    } catch (error) {
      toast.error('Failed to capture media');
      console.error('Capture error:', error);
    }
  };

  const handleSwitchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    try {
      const newStream = await cameraService.switchCamera(newFacingMode);
      setStream(newStream);
      setFacingMode(newFacingMode);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      toast.error('Failed to switch camera');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadCapture = () => {
    if (!capturedMedia) return;
    
    const url = URL.createObjectURL(capturedMedia.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency_${capturedMedia.type}_${Date.now()}.${capturedMedia.type === 'image' ? 'jpg' : 'webm'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (capturedMedia) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        <div className="flex-1 flex items-center justify-center">
          {capturedMedia.type === 'image' ? (
            <img
              src={URL.createObjectURL(capturedMedia.blob)}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={URL.createObjectURL(capturedMedia.blob)}
              controls
              className="max-w-full max-h-full"
            />
          )}
        </div>
        
        <div className="p-4 bg-black/80 flex justify-center space-x-4">
          <button
            onClick={downloadCapture}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={() => setCapturedMedia(null)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            <span>Retake</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Use This</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Camera View */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Recording Indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Mode Indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded-lg">
          <span className="text-sm capitalize">{mode} Mode</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80 flex items-center justify-between">
        <button
          onClick={onClose}
          className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-6">
          <button
            onClick={handleSwitchCamera}
            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-6 w-6" />
          </button>

          <button
            onClick={handleCapture}
            disabled={isLoading}
            className={`p-4 rounded-full transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-white hover:bg-gray-200'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {mode === 'photo' ? (
              <Camera className={`h-8 w-8 ${isRecording ? 'text-white' : 'text-black'}`} />
            ) : isRecording ? (
              <Square className="h-8 w-8 text-white" />
            ) : (
              <Video className="h-8 w-8 text-black" />
            )}
          </button>

          <div className="w-12"></div> {/* Spacer for symmetry */}
        </div>

        <div className="w-12"></div> {/* Spacer for symmetry */}
      </div>
    </motion.div>
  );
};

export default CameraCapture;