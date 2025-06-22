import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_url_here' &&
    supabaseAnonKey !== 'your_supabase_anon_key_here' &&
    isValidUrl(supabaseUrl)
  );
};

// Enhanced error handling for missing environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('Missing or invalid VITE_SUPABASE_URL environment variable');
  console.log('Please add a valid VITE_SUPABASE_URL to your .env file');
  console.log('Example: VITE_SUPABASE_URL=https://your-project-id.supabase.co');
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('Missing or invalid VITE_SUPABASE_ANON_KEY environment variable');
  console.log('Please add a valid VITE_SUPABASE_ANON_KEY to your .env file');
}

if (!isSupabaseConfigured()) {
  console.warn('Supabase not configured - using offline mode');
}

// Create client only if properly configured
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      proof_records: {
        Row: {
          id: string;
          file_name: string;
          file_type: string;
          file_hash: string;
          ipfs_hash: string;
          summary: string;
          transcript: string | null;
          algorand_tx_id: string;
          upload_date: string;
          wallet_address: string;
          status: 'processing' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_type: string;
          file_hash: string;
          ipfs_hash: string;
          summary: string;
          transcript?: string | null;
          algorand_tx_id: string;
          upload_date: string;
          wallet_address: string;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          file_type?: string;
          file_hash?: string;
          ipfs_hash?: string;
          summary?: string;
          transcript?: string | null;
          algorand_tx_id?: string;
          upload_date?: string;
          wallet_address?: string;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
      };
      emergency_reports: {
        Row: {
          id: string;
          type: string;
          title: string;
          description: string;
          location_lat: number;
          location_lng: number;
          location_address: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status: 'active' | 'responding' | 'resolved' | 'closed';
          timestamp: string;
          reporter_id: string | null;
          is_anonymous: boolean;
          urgency_score: number;
          chat_thread_id: string;
          proof_hash: string;
          ipfs_hash: string | null;
          algorand_tx_id: string | null;
          ai_suggestions: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          description: string;
          location_lat: number;
          location_lng: number;
          location_address?: string | null;
          severity: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'responding' | 'resolved' | 'closed';
          timestamp: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          urgency_score: number;
          chat_thread_id: string;
          proof_hash: string;
          ipfs_hash?: string | null;
          algorand_tx_id?: string | null;
          ai_suggestions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          description?: string;
          location_lat?: number;
          location_lng?: number;
          location_address?: string | null;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'active' | 'responding' | 'resolved' | 'closed';
          timestamp?: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          urgency_score?: number;
          chat_thread_id?: string;
          proof_hash?: string;
          ipfs_hash?: string | null;
          algorand_tx_id?: string | null;
          ai_suggestions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      responders: {
        Row: {
          id: string;
          name: string;
          role: string;
          location_lat: number | null;
          location_lng: number | null;
          is_available: boolean;
          skills: string[];
          verification_code: string;
          is_verified: boolean;
          contact_phone: string | null;
          contact_radio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          location_lat?: number | null;
          location_lng?: number | null;
          is_available?: boolean;
          skills: string[];
          verification_code: string;
          is_verified?: boolean;
          contact_phone?: string | null;
          contact_radio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          is_available?: boolean;
          skills?: string[];
          verification_code?: string;
          is_verified?: boolean;
          contact_phone?: string | null;
          contact_radio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: string;
          content: string;
          timestamp: string;
          message_type: 'text' | 'voice' | 'location' | 'media';
          media_url: string | null;
          is_system_message: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          sender_name: string;
          sender_role: string;
          content: string;
          timestamp: string;
          message_type?: 'text' | 'voice' | 'location' | 'media';
          media_url?: string | null;
          is_system_message?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          sender_name?: string;
          sender_role?: string;
          content?: string;
          timestamp?: string;
          message_type?: 'text' | 'voice' | 'location' | 'media';
          media_url?: string | null;
          is_system_message?: boolean;
          created_at?: string;
        };
      };
      verification_reports: {
        Row: {
          id: string;
          file_id: string;
          deepfake_confidence: number | null;
          deepfake_risk_level: string | null;
          metadata: any;
          transcription: any | null;
          ai_analysis: any;
          co_signatures: any[];
          overall_trust_score: number;
          verification_status: 'pending' | 'verified' | 'disputed' | 'flagged';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          file_id: string;
          deepfake_confidence?: number | null;
          deepfake_risk_level?: string | null;
          metadata: any;
          transcription?: any | null;
          ai_analysis: any;
          co_signatures?: any[];
          overall_trust_score: number;
          verification_status?: 'pending' | 'verified' | 'disputed' | 'flagged';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          file_id?: string;
          deepfake_confidence?: number | null;
          deepfake_risk_level?: string | null;
          metadata?: any;
          transcription?: any | null;
          ai_analysis?: any;
          co_signatures?: any[];
          overall_trust_score?: number;
          verification_status?: 'pending' | 'verified' | 'disputed' | 'flagged';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}