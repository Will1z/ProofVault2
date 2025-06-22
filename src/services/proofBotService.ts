import { openaiService } from './openaiService';
import { elevenlabsService } from './elevenlabsService';
import { translationService } from './translationService';
import { algorandService } from './algorandService';
import { pinataService } from './pinataService';
import { pusherService } from './pusherService';
import { offlineStorage } from './offlineStorage';

interface ProofBotMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  mode: 'text' | 'voice';
  audioUrl?: string;
  language?: string;
  urgent?: boolean;
}

interface ProofBotContext {
  userId: string;
  sessionId: string;
  language: string;
  crisisMode: boolean;
  location?: { lat: number; lng: number };
  currentStep?: string;
  emergencyType?: string;
  conversationHistory: ProofBotMessage[];
}

interface ProofBotResponse {
  text: string;
  audioUrl?: string;
  actions?: Array<{
    type: 'navigate' | 'call_function' | 'show_guide';
    payload: any;
  }>;
  urgent: boolean;
  followUp?: string[];
}

class ProofBotService {
  private contexts: Map<string, ProofBotContext> = new Map();
  private isConfigured: boolean = false;
  private offlineResponses: Map<string, ProofBotResponse> = new Map();

  constructor() {
    this.isConfigured = openaiService.isServiceConfigured();
    this.initializeOfflineResponses();
    
    if (this.isConfigured) {
      console.log('ProofBot AI Agent initialized with full capabilities');
    } else {
      console.warn('ProofBot running in offline mode with cached responses');
    }
  }

  async initializeSession(userId: string, options: {
    language?: string;
    crisisMode?: boolean;
    location?: { lat: number; lng: number };
  } = {}): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const context: ProofBotContext = {
      userId,
      sessionId,
      language: options.language || 'en',
      crisisMode: options.crisisMode || false,
      location: options.location,
      conversationHistory: [],
    };

    this.contexts.set(sessionId, context);
    
    // Store offline for crisis mode
    if (options.crisisMode) {
      await offlineStorage.storeVoiceMessage(
        new Blob(['session_init'], { type: 'text/plain' }),
        sessionId
      );
    }

    return sessionId;
  }

  async sendMessage(
    sessionId: string,
    message: string,
    mode: 'text' | 'voice' = 'text',
    audioBlob?: Blob
  ): Promise<ProofBotResponse> {
    const context = this.contexts.get(sessionId);
    if (!context) {
      throw new Error('Session not found');
    }

    // Add user message to history
    const userMessage: ProofBotMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
      mode,
      language: context.language,
    };

    context.conversationHistory.push(userMessage);

    // Process message and generate response
    const response = await this.processMessage(context, message, mode, audioBlob);

    // Add bot response to history
    const botMessage: ProofBotMessage = {
      id: `msg_${Date.now() + 1}`,
      type: 'bot',
      content: response.text,
      timestamp: new Date(),
      mode: response.audioUrl ? 'voice' : 'text',
      audioUrl: response.audioUrl,
      language: context.language,
      urgent: response.urgent,
    };

    context.conversationHistory.push(botMessage);

    // Update context
    this.contexts.set(sessionId, context);

    return response;
  }

  private async processMessage(
    context: ProofBotContext,
    message: string,
    mode: 'text' | 'voice',
    audioBlob?: Blob
  ): Promise<ProofBotResponse> {
    try {
      // Detect language if not set
      if (!context.language || context.language === 'auto') {
        const detection = await translationService.detectLanguage(message);
        context.language = detection.language;
      }

      // Translate to English for processing if needed
      let processedMessage = message;
      if (context.language !== 'en') {
        const translation = await translationService.translateText(message, 'en', context.language);
        processedMessage = translation.translatedText;
      }

      // Determine intent and generate response
      const intent = await this.analyzeIntent(processedMessage, context);
      let response = await this.generateResponse(intent, context, processedMessage);

      // Translate response back if needed
      if (context.language !== 'en') {
        const translatedResponse = await translationService.translateText(
          response.text,
          context.language,
          'en'
        );
        response.text = translatedResponse.translatedText;
      }

      // Generate voice response if requested or in crisis mode
      if (mode === 'voice' || context.crisisMode) {
        response.audioUrl = await this.generateVoiceResponse(
          response.text,
          context.crisisMode,
          context.language
        );
      }

      return response;
    } catch (error) {
      console.error('ProofBot processing error:', error);
      return this.getFallbackResponse(context, message);
    }
  }

  private async analyzeIntent(message: string, context: ProofBotContext): Promise<{
    category: string;
    urgency: number;
    entities: any[];
    action: string;
  }> {
    if (!this.isConfigured) {
      return this.getMockIntent(message, context);
    }

    try {
      const prompt = `
Analyze this emergency support message and determine:
1. Category: emergency_report, evidence_upload, blockchain_help, offline_sync, general_support
2. Urgency (1-10): How urgent is this request?
3. Entities: Extract location, emergency type, technical issues
4. Action: What should ProofBot do next?

Message: "${message}"
Context: ${context.crisisMode ? 'CRISIS MODE' : 'Normal mode'}, Location: ${context.location ? 'Available' : 'Unknown'}

Respond with JSON only:`;

      const analysis = await openaiService.analyzeContent(message, prompt);
      
      return {
        category: this.extractCategory(message),
        urgency: analysis.urgencyLevel,
        entities: analysis.keyFacts,
        action: this.determineAction(message, context),
      };
    } catch (error) {
      console.error('Intent analysis failed:', error);
      return this.getMockIntent(message, context);
    }
  }

  private async generateResponse(
    intent: any,
    context: ProofBotContext,
    message: string
  ): Promise<ProofBotResponse> {
    if (!this.isConfigured) {
      return this.getOfflineResponse(intent.category, context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(intent, message, context);

      const completion = await openaiService.analyzeContent(userPrompt, systemPrompt);

      const response: ProofBotResponse = {
        text: completion.summary,
        urgent: intent.urgency > 7,
        actions: this.generateActions(intent, context),
        followUp: completion.keyFacts.slice(0, 3),
      };

      return response;
    } catch (error) {
      console.error('Response generation failed:', error);
      return this.getOfflineResponse(intent.category, context);
    }
  }

  private buildSystemPrompt(context: ProofBotContext): string {
    const personality = context.crisisMode ? 'urgent, concise, directive' : 'professional, helpful, instructional';
    
    return `You are ProofBot, an AI assistant for ProofVault Crisis Response platform.

PERSONALITY: ${personality}
CRISIS MODE: ${context.crisisMode ? 'ACTIVE - Be concise and urgent' : 'INACTIVE - Be thorough and educational'}
USER LANGUAGE: ${context.language}
LOCATION: ${context.location ? 'Available' : 'Unknown'}

CAPABILITIES:
- Guide emergency reporting (location logging, evidence capture)
- Explain blockchain verification (Algorand timestamping, IPFS storage)
- Troubleshoot offline sync and Crisis Mode
- Connect to: Algorand, Pinata IPFS, Pusher alerts, AI services

RESPONSE RULES:
${context.crisisMode ? `
- Keep responses under 50 words
- Use urgent, clear language
- Focus on immediate actions
- Prioritize safety instructions
` : `
- Be educational and thorough
- Explain technical concepts simply
- Provide step-by-step guidance
- Offer additional resources
`}

INTEGRATION STATUS:
- Algorand: ${algorandService.isConfigured() ? 'Online' : 'Offline'}
- IPFS (Pinata): ${pinataService.isConfigured() ? 'Online' : 'Offline'}
- Real-time (Pusher): ${pusherService.isServiceConfigured() ? 'Online' : 'Offline'}
- AI Services: ${openaiService.isServiceConfigured() ? 'Online' : 'Offline'}`;
  }

  private buildUserPrompt(intent: any, message: string, context: ProofBotContext): string {
    return `
USER REQUEST: "${message}"
INTENT: ${intent.category}
URGENCY: ${intent.urgency}/10
ENTITIES: ${intent.entities.join(', ')}

CONVERSATION HISTORY:
${context.conversationHistory.slice(-4).map(msg => 
  `${msg.type}: ${msg.content}`
).join('\n')}

Provide helpful guidance based on the intent and context.`;
  }

  private async generateVoiceResponse(
    text: string,
    isUrgent: boolean,
    language: string
  ): Promise<string | undefined> {
    try {
      // Use different voice settings based on urgency
      const voiceSettings = {
        stability: isUrgent ? 0.8 : 0.5,
        similarity_boost: 0.75,
        style: isUrgent ? 0.8 : 0.5,
        use_speaker_boost: true,
      };

      const result = await elevenlabsService.generateNarration(text, undefined, voiceSettings);
      return result.audioUrl;
    } catch (error) {
      console.error('Voice generation failed:', error);
      return undefined;
    }
  }

  private generateActions(intent: any, context: ProofBotContext): Array<{
    type: 'navigate' | 'call_function' | 'show_guide';
    payload: any;
  }> {
    const actions = [];

    switch (intent.category) {
      case 'emergency_report':
        actions.push({
          type: 'navigate',
          payload: { route: '/emergency' }
        });
        if (context.location) {
          actions.push({
            type: 'call_function',
            payload: { function: 'prefillLocation', data: context.location }
          });
        }
        break;

      case 'evidence_upload':
        actions.push({
          type: 'navigate',
          payload: { route: '/upload' }
        });
        actions.push({
          type: 'show_guide',
          payload: { guide: 'evidence_capture' }
        });
        break;

      case 'blockchain_help':
        actions.push({
          type: 'show_guide',
          payload: { guide: 'blockchain_verification' }
        });
        break;

      case 'offline_sync':
        actions.push({
          type: 'call_function',
          payload: { function: 'checkOfflineStatus' }
        });
        break;
    }

    return actions;
  }

  private extractCategory(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('emergency') || lowerMessage.includes('report') || lowerMessage.includes('crisis')) {
      return 'emergency_report';
    }
    if (lowerMessage.includes('upload') || lowerMessage.includes('evidence') || lowerMessage.includes('photo')) {
      return 'evidence_upload';
    }
    if (lowerMessage.includes('blockchain') || lowerMessage.includes('algorand') || lowerMessage.includes('verify')) {
      return 'blockchain_help';
    }
    if (lowerMessage.includes('offline') || lowerMessage.includes('sync') || lowerMessage.includes('crisis mode')) {
      return 'offline_sync';
    }
    
    return 'general_support';
  }

  private determineAction(message: string, context: ProofBotContext): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('how to') || lowerMessage.includes('help me')) {
      return 'provide_guidance';
    }
    if (lowerMessage.includes('report emergency')) {
      return 'start_emergency_report';
    }
    if (lowerMessage.includes('upload') || lowerMessage.includes('capture')) {
      return 'guide_evidence_upload';
    }
    
    return 'general_assistance';
  }

  private getMockIntent(message: string, context: ProofBotContext) {
    const category = this.extractCategory(message);
    const urgencyKeywords = ['emergency', 'urgent', 'help', 'crisis', 'immediate'];
    const urgency = urgencyKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    ) ? 8 : 4;

    return {
      category,
      urgency,
      entities: [message.split(' ').slice(0, 3).join(' ')],
      action: this.determineAction(message, context),
    };
  }

  private initializeOfflineResponses(): void {
    this.offlineResponses.set('emergency_report', {
      text: "I'll help you report an emergency. First, ensure you're safe. Then go to the Emergency tab to create a report. Your location will be automatically captured to help responders find you.",
      urgent: true,
      actions: [{ type: 'navigate', payload: { route: '/emergency' } }],
      followUp: ['Need immediate help?', 'Call 911 first', 'Then use ProofVault']
    });

    this.offlineResponses.set('evidence_upload', {
      text: "To upload evidence: 1) Go to Upload tab, 2) Take photo/video or select file, 3) Your evidence will be verified with AI and stored on blockchain for tamper-proof records.",
      urgent: false,
      actions: [{ type: 'navigate', payload: { route: '/upload' } }],
      followUp: ['Supports photos, videos, audio', 'Automatic verification', 'Blockchain timestamping']
    });

    this.offlineResponses.set('blockchain_help', {
      text: "Your evidence is secured with: 1) SHA-256 hash generation, 2) IPFS decentralized storage, 3) Algorand blockchain timestamping. This creates tamper-proof records that can't be altered.",
      urgent: false,
      actions: [{ type: 'show_guide', payload: { guide: 'blockchain_verification' } }],
      followUp: ['Immutable records', 'Cryptographic proof', 'Decentralized storage']
    });

    this.offlineResponses.set('offline_sync', {
      text: "Crisis Mode keeps you operational offline. Your reports are cached locally and sync automatically when online. Check the sync status in the top navigation bar.",
      urgent: false,
      actions: [{ type: 'call_function', payload: { function: 'checkOfflineStatus' } }],
      followUp: ['Works without internet', 'Auto-sync when online', 'No data loss']
    });

    this.offlineResponses.set('general_support', {
      text: "I'm ProofBot, your AI assistant for emergency response and evidence management. I can help with reporting emergencies, uploading evidence, understanding blockchain verification, and troubleshooting offline features.",
      urgent: false,
      actions: [],
      followUp: ['Emergency reporting', 'Evidence upload', 'Blockchain verification', 'Offline support']
    });
  }

  private getOfflineResponse(category: string, context: ProofBotContext): ProofBotResponse {
    const response = this.offlineResponses.get(category) || this.offlineResponses.get('general_support')!;
    
    // Adjust for crisis mode
    if (context.crisisMode && response.text.length > 100) {
      response.text = response.text.substring(0, 100) + '...';
      response.urgent = true;
    }

    return { ...response };
  }

  private getFallbackResponse(context: ProofBotContext, message: string): ProofBotResponse {
    const fallbackText = context.crisisMode 
      ? "I'm here to help with emergencies. Say 'report emergency' or 'upload evidence' for immediate assistance."
      : "I'm ProofBot, your AI assistant. I can help with emergency reporting, evidence upload, blockchain verification, and offline sync. What do you need help with?";

    return {
      text: fallbackText,
      urgent: context.crisisMode,
      actions: [],
      followUp: context.crisisMode 
        ? ['Report emergency', 'Upload evidence', 'Get help']
        : ['Emergency guide', 'Evidence help', 'Blockchain info', 'Offline support']
    };
  }

  async getConversationHistory(sessionId: string): Promise<ProofBotMessage[]> {
    const context = this.contexts.get(sessionId);
    return context?.conversationHistory || [];
  }

  async clearSession(sessionId: string): Promise<void> {
    this.contexts.delete(sessionId);
  }

  async exportConversation(sessionId: string): Promise<string> {
    const context = this.contexts.get(sessionId);
    if (!context) return '';

    const conversation = context.conversationHistory.map(msg => 
      `[${msg.timestamp.toISOString()}] ${msg.type.toUpperCase()}: ${msg.content}`
    ).join('\n');

    return `ProofBot Conversation Export\nSession: ${sessionId}\nUser: ${context.userId}\nLanguage: ${context.language}\nCrisis Mode: ${context.crisisMode}\n\n${conversation}`;
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      activeSessions: this.contexts.size,
      offlineResponsesLoaded: this.offlineResponses.size,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'uk', 'ar', 'zh'],
      capabilities: [
        'Emergency guidance',
        'Evidence upload help',
        'Blockchain explanation',
        'Offline sync support',
        'Multi-language support',
        'Voice interaction',
        'Crisis mode optimization'
      ]
    };
  }
}

export const proofBotService = new ProofBotService();
export type { ProofBotMessage, ProofBotContext, ProofBotResponse };