export interface EmergencyReport {
  id: string;
  type: EmergencyType;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'responding' | 'resolved' | 'closed';
  timestamp: Date;
  reporterId?: string; // undefined for anonymous reports
  isAnonymous: boolean;
  media: MediaFile[];
  aiSuggestions?: string[];
  urgencyScore: number; // 1-10
  responders: string[]; // responder IDs
  chatThreadId: string;
  proofHash: string;
  ipfsHash?: string;
  algorandTxId?: string;
}

export interface MediaFile {
  id: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  filename: string;
  size: number;
  hash: string;
}

export interface Responder {
  id: string;
  name: string;
  role: ResponderRole;
  location?: {
    lat: number;
    lng: number;
  };
  isAvailable: boolean;
  skills: string[];
  verificationCode: string;
  isVerified: boolean;
  avatar?: string;
  contactInfo?: {
    phone?: string;
    radio?: string;
  };
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'reporter' | 'responder' | 'coordinator';
  content: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'location' | 'media';
  mediaUrl?: string;
  isSystemMessage?: boolean;
}

export type EmergencyType = 
  | 'fire'
  | 'flood'
  | 'earthquake'
  | 'medical'
  | 'accident'
  | 'violence'
  | 'missing_person'
  | 'infrastructure'
  | 'hazmat'
  | 'other';

export type ResponderRole = 
  | 'medic'
  | 'firefighter'
  | 'police'
  | 'search_rescue'
  | 'volunteer'
  | 'coordinator'
  | 'admin';

export interface CrisisMode {
  isEnabled: boolean;
  offlineQueue: EmergencyReport[];
  lastSync: Date;
  lowDataMode: boolean;
  emergencyContacts: string[];
}