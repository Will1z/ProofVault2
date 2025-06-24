import React, { useState, useEffect } from 'react';
import { Camera, Eye, FileText, Shield, Zap, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { googleVisionService, VisionAnalysisResult } from '../services/googleVisionService';
import { openaiVisionService, VisionDescription } from '../services/openaiVisionService';
import { exifService, ExifAnalysisResult } from '../services/exifService';
import { revenueCatService } from '../services/revenueCatService';
import toast from 'react-hot-toast';

interface ImageVerificationPanelProps {
  imageFile: File;
  onVerificationComplete?: (result: {
    googleVision?: VisionAnalysisResult;
    openaiVision?: VisionDescription;
    exifData?: ExifAnalysisResult;
    overallTrustScore: number;
  }) => void;
  className?: string;
}

const ImageVerificationPanel: React.FC<ImageVerificationPanelProps> = ({
  imageFile,
  onVerificationComplete,
  className = ''
}) => {
  const [googleVisionResult, setGoogleVisionResult] = useState<VisionAnalysisResult | null>(null);
  const [openaiVisionResult, setOpenaiVisionResult] = useState<VisionDescription | null>(null);
  const [exifResult, setExifResult] = useState<ExifAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'google' | 'openai' | 'exif' | 'summary'>('summary');
  const [overallTrustScore, setOverallTrustScore] = useState(0);
  const [isPremiumRequired, setIsPremiumRequired] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
      
      // Check if premium is required
      const needsPremium = !revenueCatService.canUseAIVerification();
      setIsPremiumRequired(needsPremium);
      
      // Start verification if premium not required
      if (!needsPremium) {
        verifyImage();
      }
    }
  }, [imageFile]);

  const verifyImage = async () => {
    if (!imageFile) return;
    
    setIsLoading(true);
    
    try {
      // Run all verifications in parallel
      const [googleVision, openaiVision, exif] = await Promise.all([
        googleVisionService.analyzeImage(imageFile).catch(error => {
          console.error('Google Vision analysis failed:', error);
          return null;
        }),
        openaiVisionService.analyzeImage(imageFile).catch(error => {
          console.error('OpenAI Vision analysis failed:', error);
          return null;
        }),
        exifService.extractExifData(imageFile).catch(error => {
          console.error('EXIF extraction failed:', error);
          return null;
        })
      ]);

      // Set results
      setGoogleVisionResult(googleVision);
      setOpenaiVisionResult(openaiVision);
      setExifResult(exif);

      // Calculate overall trust score
      const trustScore = calculateTrustScore(googleVision, openaiVision, exif);
      setOverallTrustScore(trustScore);

      // Notify parent component
      if (onVerificationComplete) {
        onVerificationComplete({
          googleVision: googleVision || undefined,
          openaiVision: openaiVision || undefined,
          exifData: exif || undefined,
          overallTrustScore: trustScore
        });
      }

      toast.success('Image verification complete');
    } catch (error) {
      console.error('Image verification failed:', error);
      toast.error('Image verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTrustScore = (
    googleVision: VisionAnalysisResult | null,
    openaiVision: VisionDescription | null,
    exif: ExifAnalysisResult | null
  ): number => {
    let score = 50; // Base score
    
    // Google Vision contribution (0-20 points)
    if (googleVision) {
      // Check for emergency context alignment
      if (googleVision.emergencyContext?.hasEmergencyIndicators) {
        score += 5;
      }
      
      // Check safe search
      const safeSearch = googleVision.safeSearchAnnotation;
      if (safeSearch.violence !== 'LIKELY' && safeSearch.violence !== 'VERY_LIKELY') {
        score += 5;
      }
      
      // Check for text consistency
      if (googleVision.textAnnotations.length > 0) {
        score += 5;
      }
      
      // Add confidence score
      score += Math.min(5, googleVision.emergencyContext?.confidence * 5 || 0);
    }
    
    // OpenAI Vision contribution (0-20 points)
    if (openaiVision) {
      // Add credibility score
      score += Math.min(15, openaiVision.verificationNotes.overallCredibility * 0.15);
      
      // Check for suspicious elements
      if (openaiVision.verificationNotes.suspiciousElements.length === 0) {
        score += 5;
      } else {
        score -= openaiVision.verificationNotes.suspiciousElements.length * 2;
      }
    }
    
    // EXIF data contribution (0-30 points)
    if (exif) {
      // Check for original timestamp
      if (exif.verificationFlags.hasOriginalTimestamp) {
        score += 10;
      }
      
      // Check for GPS data
      if (exif.verificationFlags.hasGpsData) {
        score += 10;
      }
      
      // Check for device info
      if (exif.verificationFlags.hasDeviceInfo) {
        score += 5;
      }
      
      // Check for editing
      if (!exif.verificationFlags.suspiciousEditing) {
        score += 5;
      } else {
        score -= 10;
      }
    }
    
    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const handleUpgradeClick = () => {
    // Navigate to subscription page or show subscription modal
    toast.success('Redirecting to subscription options...');
  };

  if (isPremiumRequired) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="p-6 text-center">
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Premium Feature</h3>
            <p className="text-amber-700 mb-4">
              AI-powered image verification requires a premium subscription.
            </p>
            <button
              onClick={handleUpgradeClick}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Upgrade to Premium
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-gray-600 text-sm">
              Premium features include AI-powered verification, blockchain logging, and expert co-signatures.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="p-6 text-center">
          <Loader2 className="h-8 w-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Image</h3>
          <p className="text-gray-600">
            Running AI analysis and metadata extraction...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'summary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'google'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Google Vision
          </button>
          <button
            onClick={() => setActiveTab('openai')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'openai'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            OpenAI Vision
          </button>
          <button
            onClick={() => setActiveTab('exif')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'exif'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            EXIF Data
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image preview */}
                <div className="md:w-1/3">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Uploaded image" 
                      className="w-full h-auto rounded-lg border border-gray-200"
                    />
                  )}
                </div>
                
                {/* Summary info */}
                <div className="md:w-2/3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Verification Summary</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      overallTrustScore >= 80 ? 'bg-green-100 text-green-800' :
                      overallTrustScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Trust Score: {overallTrustScore}%
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Key Findings</h4>
                    <ul className="space-y-2">
                      {openaiVisionResult?.emergencyAssessment.isEmergency && (
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">
                              Emergency Situation Detected
                            </p>
                            <p className="text-sm text-red-700">
                              Type: {openaiVisionResult.emergencyAssessment.emergencyType || 'Unspecified'}
                            </p>
                          </div>
                        </li>
                      )}
                      
                      {exifResult?.hasLocation && (
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">
                              Location Data Present
                            </p>
                            <p className="text-sm text-green-700">
                              Coordinates: {exifResult.exifData.latitude?.toFixed(6)}, {exifResult.exifData.longitude?.toFixed(6)}
                            </p>
                          </div>
                        </li>
                      )}
                      
                      {exifResult?.hasTimestamp && (
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-800">
                              Original Timestamp Present
                            </p>
                            <p className="text-sm text-green-700">
                              Captured: {exifResult.exifData.dateTimeOriginal?.toLocaleString() || 'Unknown'}
                            </p>
                          </div>
                        </li>
                      )}
                      
                      {exifResult?.verificationFlags.suspiciousEditing && (
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-800">
                              Possible Image Editing Detected
                            </p>
                            <p className="text-sm text-orange-700">
                              Image may have been modified after capture
                            </p>
                          </div>
                        </li>
                      )}
                      
                      {googleVisionResult?.safeSearchAnnotation.violence === 'LIKELY' || 
                       googleVisionResult?.safeSearchAnnotation.violence === 'VERY_LIKELY' && (
                        <li className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">
                              Violent Content Detected
                            </p>
                            <p className="text-sm text-red-700">
                              Image contains potentially violent content
                            </p>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  {/* AI Description */}
                  {openaiVisionResult && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Description</h4>
                      <p className="text-gray-700">{openaiVisionResult.description}</p>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {openaiVisionResult?.emergencyAssessment.recommendedActions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
                      <ul className="space-y-1">
                        {openaiVisionResult.emergencyAssessment.recommendedActions.map((action, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                            <span className="text-blue-600">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Trust score bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Trust Score</h4>
                  <span className={`text-sm font-medium ${
                    overallTrustScore >= 80 ? 'text-green-600' :
                    overallTrustScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {overallTrustScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      overallTrustScore >= 80 ? 'bg-green-600' :
                      overallTrustScore >= 60 ? 'bg-yellow-500' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${overallTrustScore}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low Trust</span>
                  <span>Medium Trust</span>
                  <span>High Trust</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'google' && googleVisionResult && (
            <motion.div
              key="google"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">Google Cloud Vision Analysis</h3>
              
              {/* Labels */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Image Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {googleVisionResult.labels.map((label, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {label.description} ({Math.round(label.score * 100)}%)
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Safe Search */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Safety</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(googleVisionResult.safeSearchAnnotation).map(([category, likelihood]) => (
                    <div key={category} className="text-center">
                      <div className={`px-3 py-2 rounded-lg ${
                        likelihood === 'VERY_LIKELY' || likelihood === 'LIKELY' ? 'bg-red-100 text-red-800' :
                        likelihood === 'POSSIBLE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        <p className="text-xs font-medium capitalize">{category}</p>
                        <p className="text-sm font-semibold">{likelihood.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Text Detection */}
              {googleVisionResult.textAnnotations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detected Text</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-700">
                      {googleVisionResult.textAnnotations[0]?.description || 'No text detected'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Objects */}
              {googleVisionResult.objectAnnotations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detected Objects</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {googleVisionResult.objectAnnotations.map((obj, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{obj.name}</p>
                        <p className="text-xs text-gray-500">Confidence: {Math.round(obj.score * 100)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Emergency Context */}
              {googleVisionResult.emergencyContext && (
                <div className={`p-4 rounded-lg ${
                  googleVisionResult.emergencyContext.hasEmergencyIndicators 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    googleVisionResult.emergencyContext.hasEmergencyIndicators 
                      ? 'text-red-800' 
                      : 'text-green-800'
                  }`}>
                    Emergency Assessment
                  </h4>
                  
                  {googleVisionResult.emergencyContext.hasEmergencyIndicators ? (
                    <div className="space-y-2">
                      <p className="text-red-700">
                        <strong>Emergency indicators detected</strong> with {Math.round(googleVisionResult.emergencyContext.confidence * 100)}% confidence
                      </p>
                      <p className="text-red-700">
                        <strong>Types:</strong> {googleVisionResult.emergencyContext.emergencyTypes.join(', ')}
                      </p>
                      <p className="text-red-700">
                        <strong>Urgency Level:</strong> {googleVisionResult.emergencyContext.urgencyLevel}/10
                      </p>
                    </div>
                  ) : (
                    <p className="text-green-700">
                      No emergency indicators detected in this image
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'openai' && openaiVisionResult && (
            <motion.div
              key="openai"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">OpenAI Vision Analysis</h3>
              
              {/* Description */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{openaiVisionResult.description}</p>
                </div>
              </div>
              
              {/* Emergency Assessment */}
              <div className={`p-4 rounded-lg ${
                openaiVisionResult.emergencyAssessment.isEmergency 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  openaiVisionResult.emergencyAssessment.isEmergency 
                    ? 'text-red-800' 
                    : 'text-green-800'
                }`}>
                  Emergency Assessment
                </h4>
                
                {openaiVisionResult.emergencyAssessment.isEmergency ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <p className="text-red-700 font-medium">
                        Emergency Situation Detected
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-red-700">
                        <strong>Type:</strong> {openaiVisionResult.emergencyAssessment.emergencyType || 'Unspecified'}
                      </p>
                      <p className="text-sm text-red-700">
                        <strong>Urgency Level:</strong> {openaiVisionResult.emergencyAssessment.urgencyLevel}/10
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-red-700">Key Observations:</p>
                      <ul className="text-sm text-red-700 space-y-1 mt-1">
                        {openaiVisionResult.emergencyAssessment.keyObservations.map((observation, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span>•</span>
                            <span>{observation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-red-700">Recommended Actions:</p>
                      <ul className="text-sm text-red-700 space-y-1 mt-1">
                        {openaiVisionResult.emergencyAssessment.recommendedActions.map((action, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span>•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-700">
                    No emergency situation detected in this image
                  </p>
                )}
              </div>
              
              {/* Content Analysis */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Main Subjects</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {openaiVisionResult.contentAnalysis.mainSubjects.map((subject, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Setting</p>
                    <p className="text-sm text-gray-900 mt-1 capitalize">{openaiVisionResult.contentAnalysis.setting}</p>
                    {openaiVisionResult.contentAnalysis.timeOfDay && (
                      <p className="text-xs text-gray-500 mt-1">
                        Time: {openaiVisionResult.contentAnalysis.timeOfDay}
                      </p>
                    )}
                    {openaiVisionResult.contentAnalysis.weatherConditions && (
                      <p className="text-xs text-gray-500">
                        Weather: {openaiVisionResult.contentAnalysis.weatherConditions}
                      </p>
                    )}
                  </div>
                  
                  {openaiVisionResult.contentAnalysis.peopleCount !== undefined && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">People Count</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {openaiVisionResult.contentAnalysis.peopleCount} {openaiVisionResult.contentAnalysis.peopleCount === 1 ? 'person' : 'people'} visible
                      </p>
                    </div>
                  )}
                  
                  {openaiVisionResult.contentAnalysis.vehiclesPresent && 
                   openaiVisionResult.contentAnalysis.vehiclesPresent.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Vehicles</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {openaiVisionResult.contentAnalysis.vehiclesPresent.map((vehicle, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                            {vehicle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Technical Assessment */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technical Assessment</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Image Quality</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {openaiVisionResult.technicalAssessment.imageQuality}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Clarity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {openaiVisionResult.technicalAssessment.clarity}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Lighting</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {openaiVisionResult.technicalAssessment.lighting}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Composition</p>
                      <p className="text-sm font-medium text-gray-900">
                        {openaiVisionResult.technicalAssessment.composition.length > 20 
                          ? openaiVisionResult.technicalAssessment.composition.substring(0, 20) + '...' 
                          : openaiVisionResult.technicalAssessment.composition}
                      </p>
                    </div>
                  </div>
                  
                  {openaiVisionResult.technicalAssessment.potentialIssues.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Potential Issues</p>
                      <div className="flex flex-wrap gap-1">
                        {openaiVisionResult.technicalAssessment.potentialIssues.map((issue, index) => (
                          <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Verification Notes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Verification Notes</h4>
                <div className={`p-4 rounded-lg ${
                  openaiVisionResult.verificationNotes.overallCredibility >= 70 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`font-medium ${
                      openaiVisionResult.verificationNotes.overallCredibility >= 70 
                        ? 'text-green-800' 
                        : 'text-yellow-800'
                    }`}>
                      Credibility Score: {openaiVisionResult.verificationNotes.overallCredibility}%
                    </p>
                    {openaiVisionResult.verificationNotes.overallCredibility >= 70 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {openaiVisionResult.verificationNotes.authenticityIndicators.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Authenticity Indicators:</p>
                        <ul className="text-sm space-y-1 mt-1">
                          {openaiVisionResult.verificationNotes.authenticityIndicators.map((indicator, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              <span className="text-green-700">{indicator}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {openaiVisionResult.verificationNotes.suspiciousElements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Suspicious Elements:</p>
                        <ul className="text-sm space-y-1 mt-1">
                          {openaiVisionResult.verificationNotes.suspiciousElements.map((element, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                              <span className="text-red-700">{element}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'exif' && exifResult && (
            <motion.div
              key="exif"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-900">EXIF Metadata Analysis</h3>
              
              {/* Verification Score */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-blue-900">Metadata Verification</h4>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    exifResult.verificationFlags.qualityScore >= 70 ? 'bg-green-100 text-green-800' :
                    exifResult.verificationFlags.qualityScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Score: {exifResult.verificationFlags.qualityScore}/100
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    {exifResult.verificationFlags.hasOriginalTimestamp ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ${
                      exifResult.verificationFlags.hasOriginalTimestamp ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {exifResult.verificationFlags.hasOriginalTimestamp ? 'Original timestamp present' : 'No original timestamp'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {exifResult.verificationFlags.hasGpsData ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={`text-sm ${
                      exifResult.verificationFlags.hasGpsData ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {exifResult.verificationFlags.hasGpsData ? 'GPS data present' : 'No GPS data'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {exifResult.verificationFlags.hasDeviceInfo ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={`text-sm ${
                      exifResult.verificationFlags.hasDeviceInfo ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {exifResult.verificationFlags.hasDeviceInfo ? 'Device info present' : 'No device info'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!exifResult.verificationFlags.suspiciousEditing ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm ${
                      !exifResult.verificationFlags.suspiciousEditing ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {!exifResult.verificationFlags.suspiciousEditing ? 'No editing detected' : 'Suspicious editing detected'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Device Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Device Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Manufacturer</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.deviceInfo.manufacturer || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Model</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.deviceInfo.model || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Software</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.deviceInfo.software || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Image Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Resolution</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.imageQuality.resolution}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Megapixels</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.imageQuality.megapixels} MP
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Aspect Ratio</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.imageQuality.aspectRatio}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Orientation</p>
                      <p className="text-sm font-medium text-gray-900">
                        {exifResult.exifData.orientation || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Camera Settings */}
              {(exifResult.cameraSettings.aperture || 
                exifResult.cameraSettings.shutterSpeed || 
                exifResult.cameraSettings.iso || 
                exifResult.cameraSettings.focalLength) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Camera Settings</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {exifResult.cameraSettings.aperture && (
                        <div>
                          <p className="text-xs text-gray-500">Aperture</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.cameraSettings.aperture}
                          </p>
                        </div>
                      )}
                      {exifResult.cameraSettings.shutterSpeed && (
                        <div>
                          <p className="text-xs text-gray-500">Shutter Speed</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.cameraSettings.shutterSpeed}
                          </p>
                        </div>
                      )}
                      {exifResult.cameraSettings.iso && (
                        <div>
                          <p className="text-xs text-gray-500">ISO</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.cameraSettings.iso}
                          </p>
                        </div>
                      )}
                      {exifResult.cameraSettings.focalLength && (
                        <div>
                          <p className="text-xs text-gray-500">Focal Length</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.cameraSettings.focalLength}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Location Data */}
              {exifResult.hasLocation && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location Data</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="text-sm font-medium text-gray-900">
                          {exifResult.exifData.latitude?.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="text-sm font-medium text-gray-900">
                          {exifResult.exifData.longitude?.toFixed(6)}
                        </p>
                      </div>
                      {exifResult.exifData.altitude !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">Altitude</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.exifData.altitude.toFixed(2)} m
                          </p>
                        </div>
                      )}
                      {exifResult.exifData.gpsTimestamp && (
                        <div>
                          <p className="text-xs text-gray-500">GPS Timestamp</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.exifData.gpsTimestamp.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timestamp Data */}
              {exifResult.hasTimestamp && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timestamp Data</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {exifResult.exifData.dateTimeOriginal && (
                        <div>
                          <p className="text-xs text-gray-500">Original Capture Time</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.exifData.dateTimeOriginal.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {exifResult.exifData.dateTimeDigitized && (
                        <div>
                          <p className="text-xs text-gray-500">Digitized Time</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.exifData.dateTimeDigitized.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {exifResult.exifData.dateTime && (
                        <div>
                          <p className="text-xs text-gray-500">Modified Time</p>
                          <p className="text-sm font-medium text-gray-900">
                            {exifResult.exifData.dateTime.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ImageVerificationPanel;