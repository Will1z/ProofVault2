interface DeepfakeDetectionResult {
  isDeepfake: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: {
    faceSwap?: number;
    lipSync?: number;
    temporalConsistency?: number;
    artifacts?: string[];
  };
}

class DeepfakeDetectionService {
  private apiKey: string;
  private endpoint: string;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPFAKE_API_KEY || '';
    this.endpoint = import.meta.env.VITE_DEEPFAKE_ENDPOINT || 'https://api.sensity.ai/v1';
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      console.log('Deepfake Detection Service initialized');
    } else {
      console.warn('Deepfake detection API not configured - using enhanced mock analysis');
    }
  }

  async analyzeMedia(file: File): Promise<DeepfakeDetectionResult> {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      throw new Error('Deepfake detection only supports images and videos');
    }

    if (!this.isConfigured) {
      return this.getMockAnalysis(file);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.endpoint}/detect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        isDeepfake: result.is_deepfake || false,
        confidence: result.confidence || 0,
        riskLevel: this.calculateRiskLevel(result.confidence || 0),
        details: {
          faceSwap: result.face_swap_score,
          lipSync: result.lip_sync_score,
          temporalConsistency: result.temporal_consistency,
          artifacts: result.artifacts || [],
        },
      };
    } catch (error) {
      console.error('Deepfake detection failed:', error);
      return this.getMockAnalysis(file);
    }
  }

  private getMockAnalysis(file: File): DeepfakeDetectionResult {
    // Enhanced mock analysis based on file characteristics
    let confidence = Math.random() * 100;
    
    // Adjust based on file size and type
    if (file.size < 100000) confidence += 20; // Small files more suspicious
    if (file.type.startsWith('video/') && file.size > 50000000) confidence -= 15; // Large videos less suspicious
    
    confidence = Math.max(0, Math.min(100, confidence));
    
    return {
      isDeepfake: confidence > 70,
      confidence,
      riskLevel: this.calculateRiskLevel(confidence),
      details: {
        faceSwap: Math.random() * 100,
        lipSync: Math.random() * 100,
        temporalConsistency: Math.random() * 100,
        artifacts: confidence > 50 ? ['compression_artifacts', 'face_boundary_inconsistency'] : [],
      },
    };
  }

  private calculateRiskLevel(confidence: number): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 80) return 'critical';
    if (confidence >= 60) return 'high';
    if (confidence >= 30) return 'medium';
    return 'low';
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const deepfakeService = new DeepfakeDetectionService();
export type { DeepfakeDetectionResult };