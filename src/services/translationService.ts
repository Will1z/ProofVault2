interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

class TranslationService {
  private apiKey: string;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      console.log('Translation Service initialized with Google Translate');
    } else {
      console.warn('Google Translate API key not configured - using mock translations');
    }
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    if (!this.isConfigured) {
      return this.getMockTranslation(text, targetLanguage, sourceLanguage);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text,
        target: targetLanguage,
      });

      if (sourceLanguage) {
        params.append('source', sourceLanguage);
      }

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?${params}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.data.translations[0];

      return {
        translatedText: translation.translatedText,
        sourceLanguage: translation.detectedSourceLanguage || sourceLanguage || 'auto',
        targetLanguage,
        confidence: 0.95, // Google Translate doesn't provide confidence scores
      };
    } catch (error) {
      console.error('Translation failed:', error);
      return this.getMockTranslation(text, targetLanguage, sourceLanguage);
    }
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!this.isConfigured) {
      return this.getMockLanguageDetection(text);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text,
      });

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?${params}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.status}`);
      }

      const data = await response.json();
      const detection = data.data.detections[0][0];

      return {
        language: detection.language,
        confidence: detection.confidence,
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      return this.getMockLanguageDetection(text);
    }
  }

  async translateEmergencyReport(
    report: {
      title: string;
      description: string;
      aiSuggestions?: string[];
    },
    targetLanguage: string
  ): Promise<{
    title: string;
    description: string;
    aiSuggestions?: string[];
    sourceLanguage: string;
  }> {
    try {
      const [titleResult, descriptionResult, suggestionsResult] = await Promise.all([
        this.translateText(report.title, targetLanguage),
        this.translateText(report.description, targetLanguage),
        report.aiSuggestions 
          ? Promise.all(report.aiSuggestions.map(suggestion => 
              this.translateText(suggestion, targetLanguage)
            ))
          : Promise.resolve([]),
      ]);

      return {
        title: titleResult.translatedText,
        description: descriptionResult.translatedText,
        aiSuggestions: suggestionsResult.map(result => result.translatedText),
        sourceLanguage: titleResult.sourceLanguage,
      };
    } catch (error) {
      console.error('Emergency report translation failed:', error);
      throw error;
    }
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
    if (!this.isConfigured) {
      return this.getMockSupportedLanguages();
    }

    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}&target=en`
      );

      if (!response.ok) {
        throw new Error(`Languages API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.languages.map((lang: any) => ({
        code: lang.language,
        name: lang.name,
      }));
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      return this.getMockSupportedLanguages();
    }
  }

  private getMockTranslation(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): TranslationResult {
    // Simple mock translations for common emergency terms
    const mockTranslations: Record<string, Record<string, string>> = {
      es: {
        'emergency': 'emergencia',
        'fire': 'fuego',
        'medical': 'médico',
        'help': 'ayuda',
        'police': 'policía',
        'ambulance': 'ambulancia',
      },
      fr: {
        'emergency': 'urgence',
        'fire': 'feu',
        'medical': 'médical',
        'help': 'aide',
        'police': 'police',
        'ambulance': 'ambulance',
      },
      de: {
        'emergency': 'Notfall',
        'fire': 'Feuer',
        'medical': 'medizinisch',
        'help': 'Hilfe',
        'police': 'Polizei',
        'ambulance': 'Krankenwagen',
      },
    };

    let translatedText = text;
    const translations = mockTranslations[targetLanguage];
    
    if (translations) {
      Object.entries(translations).forEach(([english, translated]) => {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        translatedText = translatedText.replace(regex, translated);
      });
    } else {
      translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    return {
      translatedText,
      sourceLanguage: sourceLanguage || 'en',
      targetLanguage,
      confidence: 0.8,
    };
  }

  private getMockLanguageDetection(text: string): LanguageDetectionResult {
    // Simple heuristic-based language detection
    const spanishWords = ['emergencia', 'fuego', 'ayuda', 'policía'];
    const frenchWords = ['urgence', 'feu', 'aide', 'police'];
    const germanWords = ['Notfall', 'Feuer', 'Hilfe', 'Polizei'];

    const lowerText = text.toLowerCase();
    
    if (spanishWords.some(word => lowerText.includes(word))) {
      return { language: 'es', confidence: 0.8 };
    }
    if (frenchWords.some(word => lowerText.includes(word))) {
      return { language: 'fr', confidence: 0.8 };
    }
    if (germanWords.some(word => lowerText.includes(word))) {
      return { language: 'de', confidence: 0.8 };
    }

    return { language: 'en', confidence: 0.9 };
  }

  private getMockSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
    ];
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const translationService = new TranslationService();
export type { TranslationResult, LanguageDetectionResult };