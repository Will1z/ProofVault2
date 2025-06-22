import { openaiService } from './openaiService';

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  confidence: number;
  action: 'allow' | 'review' | 'block';
  reason?: string;
}

interface ContentAnalysis {
  text?: string;
  imageDescription?: string;
  audioTranscription?: string;
  metadata?: any;
}

class ContentModerationService {
  private isConfigured: boolean = false;

  constructor() {
    this.isConfigured = openaiService.isServiceConfigured();
    
    if (this.isConfigured) {
      console.log('Content Moderation Service initialized with OpenAI');
    } else {
      console.warn('Content moderation using enhanced mock analysis');
    }
  }

  async moderateContent(content: ContentAnalysis): Promise<ModerationResult> {
    if (!this.isConfigured) {
      return this.getMockModerationResult(content);
    }

    try {
      // Combine all text content for moderation
      const textToModerate = [
        content.text,
        content.imageDescription,
        content.audioTranscription,
      ].filter(Boolean).join(' ');

      if (!textToModerate.trim()) {
        return {
          flagged: false,
          categories: [],
          confidence: 0,
          action: 'allow',
        };
      }

      // Use OpenAI moderation API
      const moderationResult = await openaiService.moderateContent(textToModerate);
      
      // Determine action based on categories and confidence
      const action = this.determineAction(moderationResult.categories, moderationResult.flagged);
      
      return {
        flagged: moderationResult.flagged,
        categories: moderationResult.categories,
        confidence: moderationResult.flagged ? 0.85 : 0.15, // OpenAI doesn't provide confidence scores
        action,
        reason: this.generateReason(moderationResult.categories),
      };
    } catch (error) {
      console.error('Content moderation failed:', error);
      return this.getMockModerationResult(content);
    }
  }

  async moderateFile(file: File): Promise<ModerationResult> {
    try {
      let content: ContentAnalysis = {};

      // Handle different file types
      if (file.type.startsWith('text/')) {
        const text = await this.readTextFile(file);
        content.text = text;
      } else if (file.type.startsWith('image/')) {
        // For images, we'd typically use vision AI to describe content
        content.imageDescription = await this.analyzeImage(file);
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        // For audio/video, transcribe first
        try {
          const transcription = await openaiService.transcribeAudio(file);
          content.audioTranscription = transcription.text;
        } catch (error) {
          console.warn('Transcription failed for moderation:', error);
        }
      }

      return await this.moderateContent(content);
    } catch (error) {
      console.error('File moderation failed:', error);
      return {
        flagged: false,
        categories: [],
        confidence: 0,
        action: 'allow',
      };
    }
  }

  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private async analyzeImage(file: File): Promise<string> {
    // In a real implementation, you'd use GPT-4 Vision or similar
    // For now, return a generic description
    return `Image file: ${file.name} (${file.type})`;
  }

  private determineAction(categories: string[], flagged: boolean): 'allow' | 'review' | 'block' {
    if (!flagged) return 'allow';

    // Block immediately for severe violations
    const blockCategories = ['child-exploitation', 'illegal'];
    if (categories.some(cat => blockCategories.includes(cat))) {
      return 'block';
    }

    // Review for moderate violations
    const reviewCategories = ['violence', 'hate', 'harassment', 'self-harm'];
    if (categories.some(cat => reviewCategories.includes(cat))) {
      return 'review';
    }

    // Allow with warning for minor issues
    return 'allow';
  }

  private generateReason(categories: string[]): string | undefined {
    if (categories.length === 0) return undefined;

    const reasonMap: Record<string, string> = {
      'violence': 'Content contains descriptions of violence',
      'hate': 'Content contains hate speech or discriminatory language',
      'harassment': 'Content contains harassing or threatening language',
      'self-harm': 'Content contains references to self-harm',
      'sexual': 'Content contains sexual material',
      'illegal': 'Content may contain illegal activity',
    };

    const primaryCategory = categories[0];
    return reasonMap[primaryCategory] || `Content flagged for: ${categories.join(', ')}`;
  }

  private getMockModerationResult(content: ContentAnalysis): ModerationResult {
    // Enhanced mock moderation based on content analysis
    const textContent = [
      content.text,
      content.imageDescription,
      content.audioTranscription,
    ].filter(Boolean).join(' ').toLowerCase();

    const flaggedKeywords = [
      'violence', 'hate', 'threat', 'harm', 'illegal', 'inappropriate',
      'abuse', 'harassment', 'discrimination', 'explicit'
    ];

    const foundKeywords = flaggedKeywords.filter(keyword => 
      textContent.includes(keyword)
    );

    const flagged = foundKeywords.length > 0;
    const confidence = flagged ? Math.min(0.9, foundKeywords.length * 0.3) : Math.random() * 0.2;

    let action: 'allow' | 'review' | 'block' = 'allow';
    if (flagged) {
      action = confidence > 0.7 ? 'block' : 'review';
    }

    return {
      flagged,
      categories: foundKeywords,
      confidence,
      action,
      reason: flagged ? `Content contains potentially inappropriate material: ${foundKeywords.join(', ')}` : undefined,
    };
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const contentModerationService = new ContentModerationService();
export type { ModerationResult, ContentAnalysis };