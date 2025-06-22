import OpenAI from 'openai';

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface ContentAnalysis {
  summary: string;
  keyFacts: string[];
  eventTags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgencyLevel: number;
  credibilityScore: number;
  contextualFlags: string[];
}

class OpenAIService {
  private client: OpenAI | null = null;
  private isConfigured: boolean = false;
  private quotaExceeded: boolean = false;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (apiKey && apiKey.startsWith('sk-')) {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
      });
      this.isConfigured = true;
      console.log('OpenAI Service initialized with API key');
    } else {
      console.warn('OpenAI API key not configured - using mock responses');
      this.isConfigured = false;
    }
  }

  private isQuotaError(error: any): boolean {
    return error?.status === 429 || 
           error?.code === 'insufficient_quota' ||
           error?.message?.includes('quota') ||
           error?.message?.includes('429');
  }

  async transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
    if (!this.isConfigured || !this.client || this.quotaExceeded) {
      console.log('Using mock transcription - OpenAI not available');
      return this.getMockTranscription();
    }

    try {
      console.log('Transcribing audio with OpenAI Whisper...');
      
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      return {
        text: transcription.text,
        language: transcription.language || 'en',
        duration: transcription.duration || 0,
        segments: transcription.segments?.map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
        })),
      };
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn('OpenAI quota exceeded - switching to mock responses');
        this.quotaExceeded = true;
      } else {
        console.error('OpenAI transcription failed:', error);
      }
      console.log('Falling back to mock transcription');
      return this.getMockTranscription();
    }
  }

  async analyzeContent(content: string, context?: string): Promise<ContentAnalysis> {
    if (!this.isConfigured || !this.client || this.quotaExceeded) {
      console.log('Using mock analysis - OpenAI not available');
      return this.getMockAnalysis(content);
    }

    try {
      console.log('Analyzing content with GPT-3.5-turbo...');
      
      const prompt = `
Analyze the following content for emergency/crisis response purposes. Provide a JSON response with:

1. summary: A concise 2-3 sentence summary
2. keyFacts: Array of 3-5 key factual points
3. eventTags: Array of relevant tags from: [protest, explosion, medical_emergency, displacement, aid_needed, natural_disaster, conflict, infrastructure_damage, humanitarian_crisis, government_action, civilian_impact, other]
4. sentiment: positive, negative, or neutral
5. urgencyLevel: 1-10 scale (10 = immediate life-threatening)
6. credibilityScore: 0-100 based on content quality and specificity
7. contextualFlags: Array of flags like [high_urgency, requires_attention, unverified_claims, etc.]

Content to analyze:
${content}

${context ? `Additional context: ${context}` : ''}

Respond with valid JSON only:`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in emergency response and crisis analysis. Provide accurate, helpful analysis for emergency coordination.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      try {
        const analysis = JSON.parse(responseText);
        
        // Validate and sanitize the response
        return {
          summary: analysis.summary || 'Content analysis completed.',
          keyFacts: Array.isArray(analysis.keyFacts) ? analysis.keyFacts.slice(0, 5) : [],
          eventTags: Array.isArray(analysis.eventTags) ? analysis.eventTags.slice(0, 3) : ['other'],
          sentiment: ['positive', 'negative', 'neutral'].includes(analysis.sentiment) ? analysis.sentiment : 'neutral',
          urgencyLevel: Math.max(1, Math.min(10, parseInt(analysis.urgencyLevel) || 5)),
          credibilityScore: Math.max(0, Math.min(100, parseInt(analysis.credibilityScore) || 70)),
          contextualFlags: Array.isArray(analysis.contextualFlags) ? analysis.contextualFlags.slice(0, 5) : [],
        };
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        return this.getMockAnalysis(content);
      }
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn('OpenAI quota exceeded - switching to mock responses');
        this.quotaExceeded = true;
      } else {
        console.error('OpenAI content analysis failed:', error);
      }
      console.log('Falling back to mock analysis');
      return this.getMockAnalysis(content);
    }
  }

  async enhanceVoiceMessage(transcription: string, context: string = 'emergency_response'): Promise<string> {
    if (!this.isConfigured || !this.client || this.quotaExceeded) {
      console.log('Using mock enhancement - OpenAI not available');
      return this.getMockEnhancement(transcription);
    }

    try {
      console.log('Enhancing voice message with GPT-3.5-turbo...');
      
      const prompt = `
Enhance this emergency voice message transcription for professional communication:

Original: "${transcription}"
Context: ${context}

Make it:
- Clear and professional
- Remove filler words (um, uh, etc.)
- Maintain original meaning
- Add appropriate emergency response formatting
- Keep it concise

Enhanced message:`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps enhance emergency communications for clarity and professionalism while preserving the original meaning.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 200,
      });

      const enhanced = completion.choices[0]?.message?.content?.trim();
      return enhanced || this.getMockEnhancement(transcription);
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn('OpenAI quota exceeded - switching to mock responses');
        this.quotaExceeded = true;
      } else {
        console.error('OpenAI voice enhancement failed:', error);
      }
      return this.getMockEnhancement(transcription);
    }
  }

  async moderateContent(content: string): Promise<{ flagged: boolean; categories: string[] }> {
    if (!this.isConfigured || !this.client || this.quotaExceeded) {
      return { flagged: false, categories: [] };
    }

    try {
      const moderation = await this.client.moderations.create({
        input: content,
      });

      const result = moderation.results[0];
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => category);

      return {
        flagged: result.flagged,
        categories: flaggedCategories,
      };
    } catch (error) {
      if (this.isQuotaError(error)) {
        console.warn('OpenAI quota exceeded - switching to mock responses');
        this.quotaExceeded = true;
      } else {
        console.error('OpenAI moderation failed:', error);
      }
      return { flagged: false, categories: [] };
    }
  }

  private getMockTranscription(): TranscriptionResult {
    const mockTexts = [
      "Emergency services are responding to the incident. Multiple units have been dispatched to the location.",
      "We have a medical emergency at the intersection. Paramedics are needed immediately.",
      "Fire department is on scene. The situation is being contained and residents are being evacuated.",
      "Police have secured the area. Traffic is being diverted while emergency crews work.",
      "Search and rescue teams are coordinating the response. All available resources have been mobilized.",
    ];

    const text = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      text,
      language: 'en',
      duration: 15 + Math.random() * 30,
      segments: [
        { start: 0, end: 5, text: text.split('.')[0] },
        { start: 5, end: 10, text: text.split('.')[1] || '' },
      ],
    };
  }

  private getMockAnalysis(content: string): ContentAnalysis {
    const eventTags = [];
    const keyFacts = [];
    
    // Simple keyword-based analysis for mock
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('fire') || lowerContent.includes('burn')) eventTags.push('fire');
    if (lowerContent.includes('medical') || lowerContent.includes('injured')) eventTags.push('medical_emergency');
    if (lowerContent.includes('flood') || lowerContent.includes('water')) eventTags.push('natural_disaster');
    if (lowerContent.includes('accident') || lowerContent.includes('crash')) eventTags.push('accident');
    if (lowerContent.includes('help') || lowerContent.includes('aid')) eventTags.push('aid_needed');
    
    // Extract sentences as key facts
    const sentences = content.split('.').filter(s => s.trim().length > 10);
    keyFacts.push(...sentences.slice(0, 3).map(s => s.trim()));
    
    const urgencyKeywords = ['emergency', 'urgent', 'critical', 'immediate', 'danger', 'help'];
    const urgencyLevel = urgencyKeywords.some(keyword => lowerContent.includes(keyword)) 
      ? Math.floor(Math.random() * 3) + 7 
      : Math.floor(Math.random() * 5) + 3;
    
    return {
      summary: `Analysis of emergency content: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      keyFacts: keyFacts.length > 0 ? keyFacts : ['Emergency situation reported', 'Response coordination needed'],
      eventTags: eventTags.length > 0 ? eventTags : ['other'],
      sentiment: Math.random() > 0.7 ? 'negative' : Math.random() > 0.5 ? 'neutral' : 'positive',
      urgencyLevel,
      credibilityScore: Math.floor(Math.random() * 30) + 70,
      contextualFlags: urgencyLevel > 7 ? ['high_urgency', 'requires_attention'] : [],
    };
  }

  private getMockEnhancement(transcription: string): string {
    // Simple enhancement for mock
    const enhanced = transcription
      .replace(/um|uh|er|like/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return `[EMERGENCY UPDATE] ${enhanced} - Status: Active Response`;
  }

  isServiceConfigured(): boolean {
    return this.isConfigured && !this.quotaExceeded;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      quotaExceeded: this.quotaExceeded,
      hasApiKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      keyPrefix: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 8) + '...',
    };
  }

  resetQuotaStatus() {
    this.quotaExceeded = false;
  }
}

export const openaiService = new OpenAIService();
export type { TranscriptionResult, ContentAnalysis };