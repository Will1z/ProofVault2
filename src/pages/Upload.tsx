import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Mic, Image, CheckCircle2, Loader2, AlertCircle, Shield, WifiOff, Camera, Video, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../contexts/WalletContext';
import { useApp } from '../contexts/AppContext';
import { useVerification } from '../contexts/VerificationContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { processFileWithVerification } from '../services/fileProcessor';
import { offlineStorage } from '../services/offlineStorage';
import { contentModerationService, ModerationResult } from '../services/contentModerationService';
import { deepfakeService } from '../services/deepfakeService';
import { cloudinaryService } from '../services/cloudinaryService';
import { elevenlabsService } from '../services/elevenlabsService';
import { translationService } from '../services/translationService';
import { firebaseService } from '../services/firebaseService';
import { revenueCatService } from '../services/revenueCatService';
import DeepfakeDetector from '../components/DeepfakeDetector';
import MediaMetadataCard from '../components/MediaMetadataCard';
import TranscriptionCard from '../components/TranscriptionCard';
import AIAnalysisCard from '../components/AIAnalysisCard';
import BlockchainProofTimeline from '../components/BlockchainProofTimeline';
import OfflineUploadManager from '../components/OfflineUploadManager';
import ContentModerationAlert from '../components/ContentModerationAlert';
import ExpertVerificationPanel from '../components/ExpertVerificationPanel';
import CoSignaturePanel from '../components/CoSignaturePanel';
import EnhancedUpload from '../components/EnhancedUpload';
import ImageVerificationPanel from '../components/ImageVerificationPanel';
import PushNotificationManager from '../components/PushNotificationManager';
import SubscriptionPanel from '../components/SubscriptionPanel';

const Upload: React.FC = () => {
  const { isConnected, walletAddress } = useWallet();
  const { addProof } = useApp();
  const { analyzeMedia } = useVerification();
  const navigate = useNavigate();
  const [uploadStep, setUploadStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<any>(null);
  const [verificationReport, setVerificationReport] = useState<any>(null);
  const [proofRecord, setProofRecord] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [showModerationAlert, setShowModerationAlert] = useState(false);
  const [narrationAudio, setNarrationAudio] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<any>(null);
  const [imageVerificationResult, setImageVerificationResult] = useState<any>(null);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [progress, setProgress] = useState({
    hashing: false,
    transcribing: false,
    analyzing: false,
    storing: false,
    blockchain: false,
    verification: false,
    moderation: false,
    deepfake: false,
    cloudinary: false,
    narration: false,
    translation: false,
    imageVerification: false,
  });

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      await handleFileSelection(file);
    }
  }, []);

  const handleFileSelection = async (file: File, metadata?: any) => {
    // Check upload limits for free tier
    if (!revenueCatService.canUseUnlimitedUploads()) {
      const uploadLimit = revenueCatService.getUploadLimit();
      // In a real app, check against actual upload count from database
      const mockCurrentUploads = 4; // Mock value for demo
      
      if (mockCurrentUploads >= uploadLimit) {
        toast.error(`Upload limit reached (${uploadLimit}). Upgrade to premium for unlimited uploads.`);
        setShowSubscriptionPanel(true);
        return;
      }
    }
    
    // Run content moderation first
    setProgress(prev => ({ ...prev, moderation: true }));
    try {
      const modResult = await contentModerationService.moderateFile(file);
      setModerationResult(modResult);
      
      if (modResult.flagged) {
        setShowModerationAlert(true);
        setProgress(prev => ({ ...prev, moderation: false }));
        return;
      }
    } catch (error) {
      console.error('Content moderation failed:', error);
      toast.error('Content moderation failed, proceeding with upload');
    }
    
    setProgress(prev => ({ ...prev, moderation: false }));
    setSelectedFile(file);
    setFileMetadata(metadata);
    setUploadStep(1);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.webm'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleModerationProceed = () => {
    setShowModerationAlert(false);
    if (selectedFile) {
      setUploadStep(1);
    }
  };

  const handleModerationCancel = () => {
    setShowModerationAlert(false);
    setSelectedFile(null);
    setModerationResult(null);
  };

  const handleImageVerificationComplete = (result: any) => {
    setImageVerificationResult(result);
    
    // Update verification report with image verification results
    if (verificationReport) {
      const updatedReport = {
        ...verificationReport,
        imageVerification: result,
        overallTrustScore: Math.round((verificationReport.overallTrustScore + result.overallTrustScore) / 2)
      };
      setVerificationReport(updatedReport);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile || !walletAddress) return;

    // Check if premium features are required
    const isImageFile = selectedFile.type.startsWith('image/');
    const needsAIVerification = isImageFile && !revenueCatService.canUseAIVerification();
    const needsBlockchainLogging = !revenueCatService.canUseBlockchainLogging();
    
    if (needsAIVerification || needsBlockchainLogging) {
      toast.error('Premium features required for full verification');
      setShowSubscriptionPanel(true);
      return;
    }

    // Handle offline upload
    if (isOffline) {
      try {
        await handleOfflineUpload(selectedFile);
        return;
      } catch (error) {
        toast.error('Failed to queue file for offline upload');
        return;
      }
    }

    setProcessing(true);
    setUploadStep(2);

    try {
      // Enhanced deepfake detection
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setProgress(prev => ({ ...prev, deepfake: true }));
        try {
          const deepfakeResult = await deepfakeService.analyzeMedia(selectedFile);
          console.log('Deepfake analysis result:', deepfakeResult);
        } catch (error) {
          console.error('Deepfake detection failed:', error);
        }
        setProgress(prev => ({ ...prev, deepfake: false }));
      }

      // Upload to Cloudinary + IPFS
      setProgress(prev => ({ ...prev, cloudinary: true }));
      try {
        const uploadResult = await cloudinaryService.uploadToIPFS(selectedFile);
        console.log('Cloudinary + IPFS upload successful:', uploadResult);
      } catch (error) {
        console.error('Cloudinary upload failed:', error);
      }
      setProgress(prev => ({ ...prev, cloudinary: false }));

      // Image verification for image files
      if (selectedFile.type.startsWith('image/')) {
        setProgress(prev => ({ ...prev, imageVerification: true }));
        try {
          // This would be handled by the ImageVerificationPanel component
          // We're just setting the progress state here
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Image verification failed:', error);
        }
        setProgress(prev => ({ ...prev, imageVerification: false }));
      }

      const { proofRecord: record, verificationReport: report } = await processFileWithVerification(
        selectedFile,
        walletAddress,
        (step) => {
          setProgress(prev => ({ ...prev, [step]: true }));
        },
        analyzeMedia
      );

      // Generate AI narration
      setProgress(prev => ({ ...prev, narration: true }));
      try {
        const narrationResult = await elevenlabsService.generateSummaryNarration(
          report.aiAnalysis.summary,
          report.aiAnalysis.keyFacts,
          report.aiAnalysis.urgencyLevel
        );
        setNarrationAudio(narrationResult.audioUrl);
      } catch (error) {
        console.error('Narration generation failed:', error);
      }
      setProgress(prev => ({ ...prev, narration: false }));

      // Translate content if needed
      setProgress(prev => ({ ...prev, translation: true }));
      try {
        const detectedLanguage = await translationService.detectLanguage(report.aiAnalysis.summary);
        if (detectedLanguage.language !== 'en') {
          const translated = await translationService.translateEmergencyReport(
            {
              title: selectedFile.name,
              description: report.aiAnalysis.summary,
              aiSuggestions: report.aiAnalysis.keyFacts,
            },
            'en'
          );
          setTranslatedContent(translated);
        }
      } catch (error) {
        console.error('Translation failed:', error);
      }
      setProgress(prev => ({ ...prev, translation: false }));

      addProof(record);
      setProofRecord(record);
      setVerificationReport(report);
      setUploadStep(3);
      
      // Send push notification
      try {
        await firebaseService.notifyVerificationComplete(
          record.id,
          report.overallTrustScore
        );
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
      
    } catch (error) {
      console.error('Processing failed:', error);
      toast.error('Failed to process file. Please try again.');
      setProcessing(false);
      setUploadStep(1);
    }
  };

  const handleOfflineUpload = async (file: File) => {
    // Get current location if available
    let location: { lat: number; lng: number } | undefined;
    
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000,
          });
        });
        
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      }
    } catch (error) {
      console.log('Geolocation not available');
    }

    const metadata = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      timestamp: new Date(),
      location,
      description: `Offline upload: ${file.name}`,
      ...fileMetadata,
    };

    await offlineStorage.storePendingUpload(file, metadata);
    
    toast.success('File queued for upload when online');
    setUploadStep(4); // Show offline confirmation
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) return <Mic className="h-8 w-8 text-green-600" />;
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-600" />;
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8 text-purple-600" />;
    return <FileText className="h-8 w-8 text-gray-600" />;
  };

  const steps = [
    { name: 'Capture/Upload', description: 'Select or capture media' },
    { name: 'Review', description: 'Confirm details' },
    { name: 'Process', description: 'AI analysis & verification' },
    { name: 'Complete', description: 'Verification report' },
  ];

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Connection Required</h2>
          <p className="text-gray-600">
            Please connect your Algorand wallet to upload and verify evidence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Evidence Capture
          </h1>
          {isOffline && (
            <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              <WifiOff className="h-4 w-4" />
              <span>Offline Mode</span>
            </div>
          )}
        </div>
        <p className="mt-2 text-gray-600">
          Capture or upload evidence with AI analysis, blockchain verification, and enhanced features
        </p>
      </div>

      {/* Content Moderation Alert */}
      <ContentModerationAlert
        result={moderationResult!}
        onProceed={handleModerationProceed}
        onCancel={handleModerationCancel}
        isVisible={showModerationAlert}
      />

      {/* Subscription Panel (conditionally shown) */}
      {showSubscriptionPanel && (
        <SubscriptionPanel 
          userId={walletAddress}
          onSubscriptionChange={(isPremium) => {
            if (isPremium) {
              toast.success('Premium features activated!');
              setShowSubscriptionPanel(false);
            }
          }}
        />
      )}

      {/* Push Notification Manager */}
      <PushNotificationManager userId={walletAddress} />

      {/* Offline Upload Manager */}
      {isOffline && (
        <OfflineUploadManager onUploadOffline={handleOfflineUpload} />
      )}

      {/* Progress Steps */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.name} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= uploadStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index < uploadStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index <= uploadStep ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-8 w-16 h-0.5 ${
                  index < uploadStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Enhanced Upload/Capture */}
        {uploadStep === 0 && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Enhanced Upload Component */}
            <EnhancedUpload onFileSelect={handleFileSelection} />

            {/* Traditional Drag & Drop */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
              <div {...getRootProps()} className={`p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'bg-blue-50' : 'hover:bg-gray-50/50'
              }`}>
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <UploadIcon className={`h-16 w-16 ${
                      isDragActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isDragActive ? 'Drop your file here' : 'Or drag and drop files'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Traditional file upload method
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Mic className="h-4 w-4 text-green-600" />
                      <span>Audio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4 text-blue-600" />
                      <span>Images</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Video className="h-4 w-4 text-purple-600" />
                      <span>Videos</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span>Documents</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {uploadStep === 1 && selectedFile && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Review File Details</h3>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {getFileIcon(selectedFile)}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">File Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedFile.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Type</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFile.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">File Size</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Metadata Display */}
                {fileMetadata && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Captured Metadata:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {fileMetadata.location && (
                        <p>📍 Location: {fileMetadata.location.lat.toFixed(4)}, {fileMetadata.location.lng.toFixed(4)}</p>
                      )}
                      {fileMetadata.weatherData && (
                        <p>🌤️ Weather: {fileMetadata.weatherData.temperature}°C, {fileMetadata.weatherData.condition}</p>
                      )}
                      {fileMetadata.captureMethod && (
                        <p>📱 Method: {fileMetadata.captureMethod.replace('_', ' ')}</p>
                      )}
                      <p>⏰ Timestamp: {fileMetadata.timestamp?.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {/* Image Verification Preview (for image files) */}
                {selectedFile.type.startsWith('image/') && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Enhanced Image Verification
                    </h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Google Cloud Vision AI analysis</li>
                      <li>• OpenAI GPT-4 Vision description</li>
                      <li>• EXIF metadata extraction</li>
                      <li>• Geolocation and timestamp verification</li>
                      <li>• Editing and manipulation detection</li>
                    </ul>
                  </div>
                )}
                
                {/* Verification Features Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {isOffline ? 'Offline Queue Features:' : 'Enhanced Verification Analysis:'}
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Content moderation and safety screening</li>
                    {!isOffline && (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) && (
                      <li>• Advanced deepfake detection and manipulation analysis</li>
                    )}
                    <li>• Metadata extraction and geolocation capture</li>
                    {!isOffline && (selectedFile.type.startsWith('audio/') || selectedFile.type.startsWith('video/')) && (
                      <li>• Audio transcription using Whisper AI</li>
                    )}
                    <li>• AI content analysis and event classification</li>
                    <li>• Cloudinary + IPFS decentralized storage</li>
                    <li>• Blockchain proof-of-existence on Algorand</li>
                    {!isOffline && <li>• AI narration and multi-language translation</li>}
                    {!isOffline && <li>• Expert co-signature capability</li>}
                    {isOffline && <li>• Automatic sync when online</li>}
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileMetadata(null);
                  setUploadStep(0);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Choose Different File
              </button>
              <button
                onClick={handleProcess}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {isOffline ? 'Queue for Upload' : 'Process & Verify'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {uploadStep === 2 && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Processing Your Evidence</h3>
            <div className="space-y-4">
              {Object.entries({
                moderation: 'Content safety screening',
                deepfake: 'Deepfake detection analysis',
                imageVerification: 'Image verification analysis',
                hashing: 'Generating SHA-256 hash',
                transcribing: 'Transcribing audio content',
                analyzing: 'AI content analysis',
                cloudinary: 'Uploading to Cloudinary + IPFS',
                storing: 'Storing on decentralized network',
                blockchain: 'Recording on Algorand blockchain',
                verification: 'Running verification analysis',
                narration: 'Generating AI narration',
                translation: 'Processing translations',
              }).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    progress[key as keyof typeof progress]
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {progress[key as keyof typeof progress] ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    progress[key as keyof typeof progress]
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Complete with Enhanced Results */}
        {uploadStep === 3 && verificationReport && proofRecord && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-8 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Evidence Successfully Processed!</h3>
              <p className="text-green-100 mb-4">
                Your evidence has been analyzed, verified, and recorded with enhanced features.
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Trust Score: {verificationReport.overallTrustScore}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Status: {verificationReport.verificationStatus}</span>
                </div>
                {narrationAudio && (
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <span>AI Narration Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Verification Results (for image files) */}
            {selectedFile && selectedFile.type.startsWith('image/') && (
              <ImageVerificationPanel 
                imageFile={selectedFile}
                onVerificationComplete={handleImageVerificationComplete}
              />
            )}

            {/* AI Narration Player */}
            {narrationAudio && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <Mic className="h-4 w-4 mr-2" />
                  AI-Generated Narration
                </h4>
                <audio controls className="w-full">
                  <source src={narrationAudio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-purple-700 mt-2">
                  Professional narration of your evidence summary and key facts.
                </p>
              </div>
            )}

            {/* Translation Results */}
            {translatedContent && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 mb-3">Translation Available</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-indigo-800">Original Language:</span>
                    <span className="ml-2 text-indigo-700">{translatedContent.sourceLanguage}</span>
                  </div>
                  <div>
                    <span className="font-medium text-indigo-800">English Translation:</span>
                    <p className="text-indigo-700 mt-1">{translatedContent.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Timeline */}
            <BlockchainProofTimeline 
              proof={proofRecord}
              verificationReport={verificationReport}
              isExpanded={true}
            />

            {/* Verification Results */}
            <div className="grid gap-6">
              {/* Deepfake Analysis */}
              {verificationReport.deepfakeAnalysis && (
                <DeepfakeDetector analysis={verificationReport.deepfakeAnalysis} />
              )}

              {/* Metadata */}
              <MediaMetadataCard metadata={verificationReport.metadata} />

              {/* Transcription */}
              {verificationReport.transcription && (
                <TranscriptionCard transcription={verificationReport.transcription} />
              )}

              {/* AI Analysis */}
              <AIAnalysisCard analysis={verificationReport.aiAnalysis} />

              {/* Expert Verification Panel */}
              <ExpertVerificationPanel
                reportId={verificationReport.id}
                currentStatus={verificationReport.verificationStatus}
                coSignatures={verificationReport.coSignatures}
              />

              {/* Co-signature Panel */}
              <CoSignaturePanel 
                reportId={verificationReport.id}
                coSignatures={verificationReport.coSignatures}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/history')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                View All Evidence
              </button>
              <button
                onClick={() => {
                  setUploadStep(0);
                  setSelectedFile(null);
                  setFileMetadata(null);
                  setVerificationReport(null);
                  setProofRecord(null);
                  setModerationResult(null);
                  setNarrationAudio(null);
                  setTranslatedContent(null);
                  setImageVerificationResult(null);
                  setProgress({
                    hashing: false,
                    transcribing: false,
                    analyzing: false,
                    storing: false,
                    blockchain: false,
                    verification: false,
                    moderation: false,
                    deepfake: false,
                    cloudinary: false,
                    narration: false,
                    translation: false,
                    imageVerification: false,
                  });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Capture Another File
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Offline Confirmation */}
        {uploadStep === 4 && (
          <motion.div
            key="offline-complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-8 text-center"
          >
            <WifiOff className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">File Queued for Upload!</h3>
            <p className="text-orange-100 mb-4">
              Your file has been stored locally and will be automatically processed when you reconnect to the internet.
            </p>
            <div className="bg-orange-400/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-orange-100">
                The file will undergo full verification analysis including content moderation, deepfake detection, 
                AI content analysis, narration generation, and blockchain recording once online.
              </p>
            </div>
            <button
              onClick={() => {
                setUploadStep(0);
                setSelectedFile(null);
                setFileMetadata(null);
              }}
              className="mt-6 px-6 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
            >
              Capture Another File
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Upload;