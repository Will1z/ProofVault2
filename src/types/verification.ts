export interface DeepfakeAnalysis {
  confidence: number; // 0-100, higher = more likely to be fake
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionMethod: string;
  analysisTimestamp: Date;
  flaggedForReview: boolean;
  reviewNotes?: string;
}

export interface MediaMetadata {
  device?: string;
  resolution?: string;
  timestamp?: Date;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    source: 'gps' | 'network' | 'manual';
  };
  exifData?: Record<string, any>;
  fileSize: number;
  duration?: number; // for video/audio
}

export interface TranscriptionData {
  text: string;
  language: string;
  confidence: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  processingTime: number;
}

export interface AIAnalysis {
  summary: string;
  keyFacts: string[];
  eventTags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgencyLevel: number; // 1-10
  credibilityScore: number; // 0-100
  contextualFlags: string[];
}

export interface CoSignature {
  id: string;
  organizationName: string;
  verifierName: string;
  verifierRole: string;
  verificationDate: Date;
  verificationHash: string;
  credibilityRating: number; // 1-5 stars
  notes?: string;
  isVerified: boolean;
}

export interface VerificationReport {
  id: string;
  fileId: string;
  deepfakeAnalysis?: DeepfakeAnalysis;
  metadata: MediaMetadata;
  transcription?: TranscriptionData;
  aiAnalysis: AIAnalysis;
  coSignatures: CoSignature[];
  overallTrustScore: number; // 0-100 composite score
  verificationStatus: 'pending' | 'verified' | 'disputed' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationOrganization {
  id: string;
  name: string;
  type: 'news_outlet' | 'ngo' | 'government' | 'academic' | 'independent';
  credibilityRating: number;
  verificationCount: number;
  isActive: boolean;
  contactInfo?: {
    website?: string;
    email?: string;
  };
}

export type EventTag = 
  | 'protest'
  | 'explosion'
  | 'medical_emergency'
  | 'displacement'
  | 'aid_needed'
  | 'natural_disaster'
  | 'conflict'
  | 'infrastructure_damage'
  | 'humanitarian_crisis'
  | 'government_action'
  | 'civilian_impact'
  | 'other';