import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmergencyReport, Responder, ChatMessage, CrisisMode, EmergencyType } from '../types/emergency';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useWallet } from './WalletContext';
import { pusherService } from '../services/pusherService';
import { openaiService } from '../services/openaiService';
import toast from 'react-hot-toast';

interface EmergencyContextType {
  reports: EmergencyReport[];
  responders: Responder[];
  chatMessages: ChatMessage[];
  crisisMode: CrisisMode;
  currentUserRole: string | null;
  isLoading: boolean;
  isOfflineMode: boolean;
  
  // Emergency reporting
  createReport: (report: Omit<EmergencyReport, 'id' | 'timestamp' | 'chatThreadId' | 'proofHash'>) => Promise<string>;
  updateReport: (id: string, updates: Partial<EmergencyReport>) => void;
  
  // Responder management
  registerResponder: (responder: Omit<Responder, 'id'>) => Promise<void>;
  updateResponderLocation: (location: { lat: number; lng: number }) => void;
  setResponderAvailability: (available: boolean) => void;
  
  // Chat system
  sendMessage: (threadId: string, content: string, type?: 'text' | 'voice' | 'location') => Promise<void>;
  getThreadMessages: (threadId: string) => ChatMessage[];
  
  // Crisis mode
  enableCrisisMode: () => void;
  disableCrisisMode: () => void;
  syncOfflineData: () => Promise<void>;
  
  // AI assistance
  getAISuggestions: (report: EmergencyReport) => Promise<string[]>;
  processVoiceCommand: (audioBlob: Blob) => Promise<{ text: string; action?: string }>;
  
  // Data loading
  loadReports: () => Promise<void>;
  loadResponders: () => Promise<void>;
  loadMessages: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

interface EmergencyProviderProps {
  children: ReactNode;
}

export const EmergencyProvider: React.FC<EmergencyProviderProps> = ({ children }) => {
  const { walletAddress } = useWallet();
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured());
  const [crisisMode, setCrisisMode] = useState<CrisisMode>({
    isEnabled: false,
    offlineQueue: [],
    lastSync: new Date(),
    lowDataMode: false,
    emergencyContacts: [],
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!pusherService.isServiceConfigured()) {
      console.log('Pusher not configured - real-time updates disabled');
      return;
    }

    console.log('Setting up real-time emergency subscriptions...');

    // Subscribe to emergency updates
    const unsubscribeEmergency = pusherService.subscribeToEmergencyUpdates('global', (update) => {
      console.log('Real-time emergency update:', update);
      
      switch (update.type) {
        case 'new_report':
          loadReports(); // Refresh reports
          toast.success('New emergency report received');
          break;
        case 'status_update':
          loadReports(); // Refresh reports
          break;
        case 'responder_assigned':
          loadResponders(); // Refresh responders
          break;
      }
    });

    // Subscribe to responder updates
    const unsubscribeResponders = pusherService.subscribeToResponderUpdates('global', (update) => {
      console.log('Real-time responder update:', update);
      loadResponders(); // Refresh responders
    });

    return () => {
      unsubscribeEmergency();
      unsubscribeResponders();
    };
  }, []);

  // Load data from Supabase
  const loadReports = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Emergency reports - running in offline mode');
      setIsOfflineMode(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase!
        .from('emergency_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports: EmergencyReport[] = data.map(record => ({
        id: record.id,
        type: record.type as EmergencyType,
        title: record.title,
        description: record.description,
        location: {
          lat: Number(record.location_lat),
          lng: Number(record.location_lng),
          address: record.location_address || undefined,
        },
        severity: record.severity as 'low' | 'medium' | 'high' | 'critical',
        status: record.status as 'active' | 'responding' | 'resolved' | 'closed',
        timestamp: new Date(record.timestamp),
        reporterId: record.reporter_id || undefined,
        isAnonymous: record.is_anonymous,
        media: [], // TODO: Load media files
        urgencyScore: record.urgency_score,
        responders: [], // TODO: Load assigned responders
        chatThreadId: record.chat_thread_id,
        proofHash: record.proof_hash,
        ipfsHash: record.ipfs_hash || undefined,
        algorandTxId: record.algorand_tx_id || undefined,
        aiSuggestions: record.ai_suggestions || undefined,
      }));

      setReports(formattedReports);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Error loading reports:', error);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
        console.log('Emergency reports - switching to offline mode');
      } else {
        toast.error('Failed to load emergency reports');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadResponders = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Responders - running in offline mode');
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('responders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResponders: Responder[] = data.map(record => ({
        id: record.id,
        name: record.name,
        role: record.role as any,
        location: record.location_lat && record.location_lng ? {
          lat: Number(record.location_lat),
          lng: Number(record.location_lng),
        } : undefined,
        isAvailable: record.is_available,
        skills: record.skills,
        verificationCode: record.verification_code,
        isVerified: record.is_verified,
        contactInfo: {
          phone: record.contact_phone || undefined,
          radio: record.contact_radio || undefined,
        },
      }));

      setResponders(formattedResponders);
    } catch (error) {
      console.error('Error loading responders:', error);
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('404')) {
        toast.error('Failed to load responders');
      }
    }
  };

  const loadMessages = async () => {
    if (!isSupabaseConfigured()) {
      console.log('Chat messages - running in offline mode');
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('chat_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data.map(record => ({
        id: record.id,
        threadId: record.thread_id,
        senderId: record.sender_id,
        senderName: record.sender_name,
        senderRole: record.sender_role as any,
        content: record.content,
        timestamp: new Date(record.timestamp),
        type: record.message_type as any,
        mediaUrl: record.media_url || undefined,
        isSystemMessage: record.is_system_message,
      }));

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!error.message?.includes('Failed to fetch') && !error.message?.includes('404')) {
        toast.error('Failed to load chat messages');
      }
    }
  };

  const createReport = async (reportData: Omit<EmergencyReport, 'id' | 'timestamp' | 'chatThreadId' | 'proofHash'>): Promise<string> => {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const chatThreadId = `thread_${reportId}`;
    const proofHash = `hash_${reportData.type}_${Date.now()}`;

    const newReport: EmergencyReport = {
      ...reportData,
      id: reportId,
      timestamp: new Date(),
      chatThreadId,
      proofHash,
    };

    try {
      // Get real AI suggestions using OpenAI
      const suggestions = await getAISuggestions(newReport);
      newReport.aiSuggestions = suggestions;

      if (isSupabaseConfigured()) {
        // Save to Supabase
        const { error } = await supabase!
          .from('emergency_reports')
          .insert({
            id: newReport.id,
            type: newReport.type,
            title: newReport.title,
            description: newReport.description,
            location_lat: newReport.location.lat,
            location_lng: newReport.location.lng,
            location_address: newReport.location.address,
            severity: newReport.severity,
            status: newReport.status,
            timestamp: newReport.timestamp.toISOString(),
            reporter_id: newReport.reporterId,
            is_anonymous: newReport.isAnonymous,
            urgency_score: newReport.urgencyScore,
            chat_thread_id: newReport.chatThreadId,
            proof_hash: newReport.proofHash,
            ai_suggestions: newReport.aiSuggestions,
          });

        if (error) throw error;

        // Trigger real-time update via Pusher
        pusherService.triggerEvent('emergency-updates-global', 'new-report', {
          reportId: newReport.id,
          type: newReport.type,
          severity: newReport.severity,
          location: newReport.location,
          timestamp: newReport.timestamp.toISOString(),
        });
      }

      setReports(prev => [newReport, ...prev]);
      
      if (isOfflineMode) {
        toast.success('Emergency report created (offline mode)');
      } else {
        toast.success('Emergency report created successfully');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      
      if (crisisMode.isEnabled && !navigator.onLine) {
        // Queue for offline sync
        setCrisisMode(prev => ({
          ...prev,
          offlineQueue: [...prev.offlineQueue, newReport],
        }));
        toast.success('Report queued for upload when online');
      } else {
        // Still add to local state
        setReports(prev => [newReport, ...prev]);
        
        if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
          setIsOfflineMode(true);
          toast.success('Emergency report created (offline mode)');
        } else {
          toast.error('Failed to create emergency report in database');
        }
      }
    }

    return reportId;
  };

  const updateReport = (id: string, updates: Partial<EmergencyReport>) => {
    setReports(prev =>
      prev.map(report => (report.id === id ? { ...report, ...updates } : report))
    );

    // Trigger real-time update
    if (pusherService.isServiceConfigured()) {
      pusherService.triggerEvent('emergency-updates-global', 'status-update', {
        reportId: id,
        updates,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const registerResponder = async (responderData: Omit<Responder, 'id'>): Promise<void> => {
    const responderId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newResponder: Responder = {
      ...responderData,
      id: responderId,
    };

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('responders')
          .insert({
            id: newResponder.id,
            name: newResponder.name,
            role: newResponder.role,
            location_lat: newResponder.location?.lat,
            location_lng: newResponder.location?.lng,
            is_available: newResponder.isAvailable,
            skills: newResponder.skills,
            verification_code: newResponder.verificationCode,
            is_verified: newResponder.isVerified,
            contact_phone: newResponder.contactInfo?.phone,
            contact_radio: newResponder.contactInfo?.radio,
          });

        if (error) throw error;
      }

      setResponders(prev => [...prev, newResponder]);
      setCurrentUserRole(responderData.role);
      
      if (isOfflineMode) {
        toast.success('Responder registration successful (offline mode)');
      } else {
        toast.success('Responder registration successful');
      }
    } catch (error) {
      console.error('Error registering responder:', error);
      
      // Still add to local state
      setResponders(prev => [...prev, newResponder]);
      setCurrentUserRole(responderData.role);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
        toast.success('Responder registration successful (offline mode)');
      } else {
        toast.error('Failed to register responder in database');
      }
    }
  };

  const updateResponderLocation = (location: { lat: number; lng: number }) => {
    if (!walletAddress) return;
    
    setResponders(prev =>
      prev.map(responder =>
        responder.id === walletAddress ? { ...responder, location } : responder
      )
    );
  };

  const setResponderAvailability = (available: boolean) => {
    if (!walletAddress) return;
    
    setResponders(prev =>
      prev.map(responder =>
        responder.id === walletAddress ? { ...responder, isAvailable: available } : responder
      )
    );
  };

  const sendMessage = async (threadId: string, content: string, type: 'text' | 'voice' | 'location' = 'text') => {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMessage: ChatMessage = {
      id: messageId,
      threadId,
      senderId: walletAddress || 'anonymous',
      senderName: currentUserRole ? `${currentUserRole} User` : 'Anonymous',
      senderRole: currentUserRole as any || 'reporter',
      content,
      timestamp: new Date(),
      type,
    };

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase!
          .from('chat_messages')
          .insert({
            id: newMessage.id,
            thread_id: newMessage.threadId,
            sender_id: newMessage.senderId,
            sender_name: newMessage.senderName,
            sender_role: newMessage.senderRole,
            content: newMessage.content,
            timestamp: newMessage.timestamp.toISOString(),
            message_type: newMessage.type,
            is_system_message: false,
          });

        if (error) throw error;

        // Trigger real-time message update
        pusherService.triggerEvent(`chat-${threadId}`, 'new-message', {
          ...newMessage,
          timestamp: newMessage.timestamp.toISOString(),
        });
      }

      setChatMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Still add to local state for offline functionality
      setChatMessages(prev => [...prev, newMessage]);
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('404')) {
        setIsOfflineMode(true);
      } else {
        toast.error('Failed to send message to database');
      }
    }
  };

  const getThreadMessages = (threadId: string): ChatMessage[] => {
    return chatMessages.filter(msg => msg.threadId === threadId);
  };

  const enableCrisisMode = () => {
    setCrisisMode(prev => ({ ...prev, isEnabled: true, lowDataMode: true }));
    toast.success('Crisis mode enabled - Offline ready');
  };

  const disableCrisisMode = () => {
    setCrisisMode(prev => ({ ...prev, isEnabled: false, lowDataMode: false }));
    toast.success('Crisis mode disabled');
  };

  const syncOfflineData = async (): Promise<void> => {
    if (crisisMode.offlineQueue.length === 0) return;

    try {
      for (const report of crisisMode.offlineQueue) {
        setReports(prev => [report, ...prev]);
      }
      
      setCrisisMode(prev => ({
        ...prev,
        offlineQueue: [],
        lastSync: new Date(),
      }));
      
      toast.success(`Synced ${crisisMode.offlineQueue.length} offline reports`);
    } catch (error) {
      toast.error('Failed to sync offline data');
    }
  };

  const getAISuggestions = async (report: EmergencyReport): Promise<string[]> => {
    try {
      console.log('Getting AI suggestions for emergency report...');
      
      // Use real OpenAI analysis
      const analysis = await openaiService.analyzeContent(
        `${report.title}. ${report.description}`,
        `Emergency type: ${report.type}, Severity: ${report.severity}, Location: ${report.location.lat}, ${report.location.lng}`
      );
      
      // Convert analysis into actionable suggestions
      const suggestions = [
        `Urgency Level: ${analysis.urgencyLevel}/10 - ${analysis.urgencyLevel > 7 ? 'Immediate response required' : 'Standard response protocol'}`,
        ...analysis.keyFacts.slice(0, 3),
        `Recommended actions based on ${report.type} emergency protocols`,
      ];
      
      return suggestions;
    } catch (error) {
      console.error('AI suggestions failed, using fallback:', error);
      
      // Fallback to predefined suggestions
      const suggestions: Record<string, string[]> = {
        fire: ['Evacuate immediately', 'Call fire department', 'Avoid smoke inhalation', 'Use stairs, not elevators'],
        medical: ['Call 911 immediately', 'Check pulse and breathing', 'Keep patient calm', 'Apply first aid if trained'],
        flood: ['Move to higher ground', 'Avoid walking in moving water', 'Turn off utilities', 'Stay informed via radio'],
        earthquake: ['Drop, cover, and hold on', 'Stay away from windows', 'Check for injuries', 'Be prepared for aftershocks'],
        accident: ['Ensure scene safety', 'Call emergency services', 'Provide first aid if qualified', 'Direct traffic if needed'],
      };

      return suggestions[report.type] || ['Call emergency services', 'Ensure personal safety', 'Follow official instructions'];
    }
  };

  const processVoiceCommand = async (audioBlob: Blob): Promise<{ text: string; action?: string }> => {
    try {
      console.log('Processing voice command with OpenAI Whisper...');
      
      // Convert blob to file for OpenAI API
      const audioFile = new File([audioBlob], 'voice_command.webm', { type: 'audio/webm' });
      
      const result = await openaiService.transcribeAudio(audioFile);
      
      // Analyze the transcription for actions
      const text = result.text.toLowerCase();
      let action: string | undefined;
      
      if (text.includes('fire') || text.includes('burning')) {
        action = 'create_fire_report';
      } else if (text.includes('medical') || text.includes('injured') || text.includes('hurt')) {
        action = 'create_medical_report';
      } else if (text.includes('responder') || text.includes('help')) {
        action = 'show_responders';
      } else if (text.includes('what should') || text.includes('advice')) {
        action = 'get_advice';
      }
      
      return { text: result.text, action };
    } catch (error) {
      console.error('Voice command processing failed, using mock:', error);
      
      // Fallback to mock processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockTranscriptions = [
        { text: 'There is a fire on Main Street, need help immediately', action: 'create_fire_report' },
        { text: 'Medical emergency, person unconscious', action: 'create_medical_report' },
        { text: 'Show me nearby responders', action: 'show_responders' },
        { text: 'What should I do for chest pain?', action: 'get_medical_advice' },
      ];

      return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    }
  };

  // Load data on mount
  useEffect(() => {
    loadReports();
    loadResponders();
    loadMessages();
  }, []);

  // Set up real-time subscriptions only if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const reportsSubscription = supabase!
      .channel('emergency_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_reports' }, () => {
        loadReports();
      })
      .subscribe();

    const messagesSubscription = supabase!
      .channel('chat_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      reportsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, []);

  return (
    <EmergencyContext.Provider
      value={{
        reports,
        responders,
        chatMessages,
        crisisMode,
        currentUserRole,
        isLoading,
        isOfflineMode,
        createReport,
        updateReport,
        registerResponder,
        updateResponderLocation,
        setResponderAvailability,
        sendMessage,
        getThreadMessages,
        enableCrisisMode,
        disableCrisisMode,
        syncOfflineData,
        getAISuggestions,
        processVoiceCommand,
        loadReports,
        loadResponders,
        loadMessages,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};