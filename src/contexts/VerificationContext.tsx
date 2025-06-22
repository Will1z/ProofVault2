import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VerificationReport, DeepfakeAnalysis, MediaMetadata, TranscriptionData, AIAnalysis, CoSignature, VerificationOrganization, EventTag } from '../types/verification';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useWallet } from './WalletContext';
import toast from 'react-hot-toast';

interface VerificationContextType {
  verificationReports: VerificationReport[];
  organizations: VerificationOrganization[];
  isLoading: boolean;
  isOfflineMode: boolean;
  
  // Core verification functions
  analyzeMedia: (file: File, fileId: string) => Promise<VerificationReport>;
  requestCoSignature: (reportId: string, organizationId: string, notes?: string) => Promise<void>;
  
  // Deepfake detection
  detectDeepfake: (file: File) => Promise<DeepfakeAnalysis>;
  
  // Metadata extraction
  extractMetadata: (file: File) => Promise<MediaMetadata>;
  
  // Transcription and AI analysis
  transcribeMedia: (file: File) => Promise<TranscriptionData>;
  analyzeContent: (content: string, metadata: MediaMetadata) => Promise<AIAnalysis>;
  
  // Organization management
  getVerifiedOrganizations: () => VerificationOrganization[];
  
  // Filtering and search
  filterByTags: (tags: EventTag[]) => VerificationReport[];
  searchReports: (query: string) => VerificationReport[];
  
  // Data loading
  loadVerificationReports: () => Promise<void>;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
};

interface VerificationProviderProps {
  children: ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  const { walletAddress } = useWallet();
  const [verificationReports, setVerificationReports] = useState<VerificationReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured());
  const [organizations] = useState<VerificationOrganization[]>([
    {
      id: 'org_1',
      name: 'Reuters Fact Check',
      type: 'news_outlet',
      credibilityRating: 4.8,
      verificationCount: 1247,
      isActive: true,
      contactInfo: { website: 'reuters.com', email: 'factcheck@reuters.com' },
    },
    {
      id: 'org_2',
      name: 'Human Rights Watch',
      type: 'ngo',
      credibilityRating: 4.7,
      verificationCount: 892,
      isActive: true,
      contactInfo: { website: 'hrw.org', email: 'verification@hrw.org' },
    },
    {
      id: 'org_3',
      name: 'MIT Digital Forensics Lab',
      type: 'academic',
      credibilityRating: 4.9,
      verificationCount: 456,
      isActive: true,
      contactInfo: { website: 'mit.edu/digitalforensics' },
    },
  ]);

  const loadVerificationReports = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Verification reports - running in offline mode');
      setIsOfflineMode(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase!
        .from('verification_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports: VerificationReport[] = data.map(record => ({
        id: record.id,
        fileId: record.file_id,
        deepfakeAnalysis: record.deepfake_confidence ? {
          confidence: record.deepfake_confidence,
          riskLevel: record.deepfake_risk_level as any,
          detectionMethod: 'AI Detection',
          analysisTimestamp: new Date(record.created_at),
          flaggedForReview: record.deepfake_confidence > 70,
        } : undefined,
        metadata: record.metadata,
        transcription: record.transcription,
        aiAnalysis: record.ai_analysis,
        coSignatures: record.co_signatures || [],
        overallTrustScore: record.overall_trust_score,
        verificationStatus: record.verification_status as any,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at),
      }));

      setVerificationReports(formattedReports);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Error loading verification reports:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
        console.log('Verification reports - switching to offline mode');
      } else {
        toast.error('Failed to load verification reports');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const detectDeepfake = async (file: File): Promise<DeepfakeAnalysis> => {
    // Mock deepfake detection - in production, use actual ML models
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isVideo && !isImage) {
      throw new Error('Deepfake detection only supports video and image files');
    }
    
    // Simulate analysis with realistic results
    const confidence = Math.random() * 100;
    const riskLevel = confidence > 80 ? 'critical' : 
                     confidence > 60 ? 'high' : 
                     confidence > 30 ? 'medium' : 'low';
    
    return {
      confidence,
      riskLevel,
      detectionMethod: isVideo ? 'FaceSwap Detection + Temporal Analysis' : 'Face Manipulation Detection',
      analysisTimestamp: new Date(),
      flaggedForReview: confidence > 70,
      reviewNotes: confidence > 70 ? 'High probability of manipulation detected. Manual review recommended.' : undefined,
    };
  };

  const extractMetadata = async (file: File): Promise<MediaMetadata> => {
    // Get geolocation if available
    let location: MediaMetadata['location'] | undefined;
    
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        });
        
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'gps',
        };
      }
    } catch (error) {
      console.log('Geolocation not available or denied');
    }

    // Mock EXIF extraction - in production, use exif-js or similar
    const mockExifData = {
      make: 'Apple',
      model: 'iPhone 14 Pro',
      software: 'iOS 17.1',
      dateTime: new Date().toISOString(),
      gpsLatitude: location?.lat,
      gpsLongitude: location?.lng,
    };

    return {
      device: `${mockExifData.make} ${mockExifData.model}`,
      resolution: file.type.startsWith('image/') ? '4032x3024' : '1920x1080',
      timestamp: new Date(mockExifData.dateTime),
      location,
      exifData: mockExifData,
      fileSize: file.size,
      duration: file.type.startsWith('video/') ? 45 : undefined,
    };
  };

  const transcribeMedia = async (file: File): Promise<TranscriptionData> => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      throw new Error('Transcription only supports audio and video files');
    }

    // Mock Whisper API call - in production, use OpenAI Whisper
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const mockTranscripts = [
      "This is a live report from the scene. We can see significant damage to the infrastructure and people are being evacuated from the area.",
      "Emergency services have arrived and are coordinating the response. Medical teams are treating injured civilians.",
      "The situation appears to be under control now. Authorities are asking people to avoid the area while cleanup continues.",
      "We're witnessing unprecedented cooperation between local organizations and international aid groups.",
    ];

    const text = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    
    return {
      text,
      language: 'en',
      confidence: 0.95,
      segments: [
        { start: 0, end: 5, text: text.split('.')[0] },
        { start: 5, end: 10, text: text.split('.')[1] || '' },
      ],
      processingTime: 4.2,
    };
  };

  const analyzeContent = async (content: string, metadata: MediaMetadata): Promise<AIAnalysis> => {
    // Mock GPT-4 analysis - in production, use OpenAI API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const eventTags: EventTag[] = [];
    const keyFacts: string[] = [];
    
    // Simple keyword-based tagging (in production, use proper NLP)
    if (content.toLowerCase().includes('protest') || content.toLowerCase().includes('demonstration')) {
      eventTags.push('protest');
    }
    if (content.toLowerCase().includes('explosion') || content.toLowerCase().includes('blast')) {
      eventTags.push('explosion');
    }
    if (content.toLowerCase().includes('medical') || content.toLowerCase().includes('injured')) {
      eventTags.push('medical_emergency');
    }
    if (content.toLowerCase().includes('evacuat') || content.toLowerCase().includes('displacement')) {
      eventTags.push('displacement');
    }
    if (content.toLowerCase().includes('aid') || content.toLowerCase().includes('help')) {
      eventTags.push('aid_needed');
    }
    
    // Extract key facts
    const sentences = content.split('.').filter(s => s.trim().length > 10);
    keyFacts.push(...sentences.slice(0, 3).map(s => s.trim()));
    
    const urgencyKeywords = ['emergency', 'urgent', 'critical', 'immediate', 'danger'];
    const urgencyLevel = urgencyKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    ) ? Math.floor(Math.random() * 3) + 7 : Math.floor(Math.random() * 5) + 3;
    
    return {
      summary: `AI Analysis: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`,
      keyFacts,
      eventTags: eventTags.length > 0 ? eventTags : ['other'],
      sentiment: Math.random() > 0.5 ? 'neutral' : Math.random() > 0.5 ? 'negative' : 'positive',
      urgencyLevel,
      credibilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
      contextualFlags: urgencyLevel > 7 ? ['high_urgency', 'requires_attention'] : [],
    };
  };

  const analyzeMedia = async (file: File, fileId: string): Promise<VerificationReport> => {
    const reportId = `verification_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      // Extract metadata first
      const metadata = await extractMetadata(file);
      
      // Detect deepfakes for images/videos
      let deepfakeAnalysis: DeepfakeAnalysis | undefined;
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        deepfakeAnalysis = await detectDeepfake(file);
      }
      
      // Transcribe audio/video content
      let transcription: TranscriptionData | undefined;
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        transcription = await transcribeMedia(file);
      }
      
      // Analyze content with AI
      const contentToAnalyze = transcription?.text || file.name;
      const aiAnalysis = await analyzeContent(contentToAnalyze, metadata);
      
      // Calculate overall trust score
      const deepfakeScore = deepfakeAnalysis ? (100 - deepfakeAnalysis.confidence) : 100;
      const credibilityScore = aiAnalysis.credibilityScore;
      const metadataScore = metadata.location && metadata.timestamp ? 90 : 70;
      
      const overallTrustScore = Math.floor(
        (deepfakeScore * 0.4 + credibilityScore * 0.4 + metadataScore * 0.2)
      );
      
      const report: VerificationReport = {
        id: reportId,
        fileId,
        deepfakeAnalysis,
        metadata,
        transcription,
        aiAnalysis,
        coSignatures: [],
        overallTrustScore,
        verificationStatus: deepfakeAnalysis?.flaggedForReview ? 'flagged' : 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const { error } = await supabase!
            .from('verification_reports')
            .insert({
              id: report.id,
              file_id: report.fileId,
              deepfake_confidence: deepfakeAnalysis?.confidence,
              deepfake_risk_level: deepfakeAnalysis?.riskLevel,
              metadata: report.metadata,
              transcription: report.transcription,
              ai_analysis: report.aiAnalysis,
              co_signatures: report.coSignatures,
              overall_trust_score: report.overallTrustScore,
              verification_status: report.verificationStatus,
            });

          if (error) throw error;
          toast.success('Verification report saved to database');
        } catch (error) {
          console.error('Error saving verification report:', error);
          if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
            setIsOfflineMode(true);
            toast.success('Verification report saved locally (offline mode)');
          } else {
            toast.error('Failed to save verification report to database');
          }
        }
      } else {
        toast.success('Verification report created (offline mode)');
      }
      
      setVerificationReports(prev => [report, ...prev]);
      return report;
      
    } catch (error) {
      console.error('Media analysis failed:', error);
      throw error;
    }
  };

  const requestCoSignature = async (reportId: string, organizationId: string, notes?: string): Promise<void> => {
    const organization = organizations.find(org => org.id === organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    // Mock co-signature process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const coSignature: CoSignature = {
      id: `cosign_${Date.now()}`,
      organizationName: organization.name,
      verifierName: 'Dr. Sarah Johnson', // Mock verifier
      verifierRole: 'Senior Fact Checker',
      verificationDate: new Date(),
      verificationHash: `hash_${Math.random().toString(36).substring(2, 15)}`,
      credibilityRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
      notes,
      isVerified: true,
    };
    
    setVerificationReports(prev =>
      prev.map(report =>
        report.id === reportId
          ? {
              ...report,
              coSignatures: [...report.coSignatures, coSignature],
              overallTrustScore: Math.min(100, report.overallTrustScore + 10),
              verificationStatus: 'verified' as const,
              updatedAt: new Date(),
            }
          : report
      )
    );
    
    toast.success(`Co-signature requested from ${organization.name}`);
  };

  const getVerifiedOrganizations = (): VerificationOrganization[] => {
    return organizations.filter(org => org.isActive);
  };

  const filterByTags = (tags: EventTag[]): VerificationReport[] => {
    return verificationReports.filter(report =>
      tags.some(tag => report.aiAnalysis.eventTags.includes(tag))
    );
  };

  const searchReports = (query: string): VerificationReport[] => {
    const lowercaseQuery = query.toLowerCase();
    return verificationReports.filter(report =>
      report.aiAnalysis.summary.toLowerCase().includes(lowercaseQuery) ||
      report.transcription?.text.toLowerCase().includes(lowercaseQuery) ||
      report.aiAnalysis.keyFacts.some(fact => fact.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Load data on mount
  useEffect(() => {
    loadVerificationReports();
  }, []);

  // Set up real-time subscription only if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const subscription = supabase!
      .channel('verification_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_reports' }, () => {
        loadVerificationReports();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <VerificationContext.Provider
      value={{
        verificationReports,
        organizations,
        isLoading,
        isOfflineMode,
        analyzeMedia,
        requestCoSignature,
        detectDeepfake,
        extractMetadata,
        transcribeMedia,
        analyzeContent,
        getVerifiedOrganizations,
        filterByTags,
        searchReports,
        loadVerificationReports,
      }}
    >
      {children}
    </VerificationContext.Provider>
  );
};