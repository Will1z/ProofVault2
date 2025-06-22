import React, { useState } from 'react';
import { Camera, Video, Mic, Upload, Globe, Zap, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import CameraCapture from './CameraCapture';
import { cameraService, CameraCapture as CameraCaptureType } from '../services/cameraService';
import { cloudinaryService } from '../services/cloudinaryService';
import { elevenlabsService } from '../services/elevenlabsService';
import { translationService } from '../services/translationService';
import { weatherService } from '../services/weatherService';
import toast from 'react-hot-toast';

interface EnhancedUploadProps {
  onFileSelect: (file: File, metadata?: any) => void;
  className?: string;
}

const EnhancedUpload: React.FC<EnhancedUploadProps> = ({ onFileSelect, className = '' }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCameraCapture = async (capture: CameraCaptureType & { weatherData?: any }) => {
    setShowCamera(false);
    setIsProcessing(true);

    try {
      // Convert blob to file
      const file = new File([capture.blob], 
        `emergency_${capture.type}_${Date.now()}.${capture.type === 'image' ? 'jpg' : 'webm'}`,
        { type: capture.blob.type }
      );

      // Enhanced metadata with weather and location
      const enhancedMetadata = {
        ...capture.metadata,
        weatherData: capture.weatherData,
        captureMethod: 'direct_camera',
        emergencyContext: true,
      };

      // Upload to Cloudinary + IPFS
      try {
        const uploadResult = await cloudinaryService.uploadToIPFS(file);
        enhancedMetadata.cloudinaryUrl = uploadResult.cloudinaryUrl;
        enhancedMetadata.ipfsHash = uploadResult.ipfsHash;
        toast.success('Media uploaded to cloud storage');
      } catch (error) {
        console.warn('Cloud upload failed:', error);
      }

      onFileSelect(file, enhancedMetadata);
      
    } catch (error) {
      toast.error('Failed to process captured media');
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceRecording = async () => {
    try {
      setIsProcessing(true);
      
      // Use existing voice service for recording
      const { voiceService } = await import('../services/voiceService');
      
      await voiceService.startRecording();
      toast.success('Recording started - speak now');
      
      // Auto-stop after 30 seconds or user interaction
      setTimeout(async () => {
        try {
          const audioBlob = await voiceService.stopRecording();
          
          // Convert to file
          const file = new File([audioBlob], 
            `emergency_voice_${Date.now()}.webm`,
            { type: 'audio/webm' }
          );

          // Get location for context
          let location;
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
            console.log('Location not available');
          }

          const metadata = {
            timestamp: new Date(),
            location,
            captureMethod: 'voice_recording',
            emergencyContext: true,
          };

          onFileSelect(file, metadata);
          toast.success('Voice recording captured');
          
        } catch (error) {
          toast.error('Failed to process voice recording');
        }
      }, 30000);
      
    } catch (error) {
      toast.error('Failed to start voice recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const captureOptions = [
    {
      id: 'photo',
      title: 'Take Photo',
      description: 'Capture image evidence',
      icon: Camera,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        setCameraMode('photo');
        setShowCamera(true);
      },
    },
    {
      id: 'video',
      title: 'Record Video',
      description: 'Capture video evidence',
      icon: Video,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => {
        setCameraMode('video');
        setShowCamera(true);
      },
    },
    {
      id: 'voice',
      title: 'Voice Recording',
      description: 'Record audio testimony',
      icon: Mic,
      color: 'bg-green-600 hover:bg-green-700',
      action: handleVoiceRecording,
    },
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Select from device',
      icon: Upload,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            onFileSelect(file);
          }
        };
        input.click();
      },
    },
  ];

  if (showCamera) {
    return (
      <CameraCapture
        mode={cameraMode}
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Capture Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {captureOptions.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={option.action}
            disabled={isProcessing}
            className={`${option.color} text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option.icon className="h-8 w-8 mx-auto mb-3" />
            <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
            <p className="text-xs opacity-90">{option.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Enhanced Features Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Zap className="h-5 w-5 text-blue-600 mr-2" />
          Enhanced Capabilities
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-800">
              <Camera className="h-4 w-4" />
              <span>Direct camera/video capture</span>
            </div>
            <div className="flex items-center space-x-2 text-green-800">
              <Globe className="h-4 w-4" />
              <span>Auto weather/location tagging</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-800">
              <Mic className="h-4 w-4" />
              <span>Voice-to-text transcription</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-orange-800">
              <Upload className="h-4 w-4" />
              <span>Cloudinary + IPFS storage</span>
            </div>
            <div className="flex items-center space-x-2 text-red-800">
              <Zap className="h-4 w-4" />
              <span>Blockchain timestamping</span>
            </div>
            <div className="flex items-center space-x-2 text-indigo-800">
              <Volume2 className="h-4 w-4" />
              <span>AI narration & translation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-800 font-medium">Processing media...</p>
          <p className="text-blue-600 text-sm">Adding location, weather, and metadata</p>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedUpload;