import { openaiService } from './openaiService';

interface VisionDescription {
  description: string;
  emergencyAssessment: {
    isEmergency: boolean;
    emergencyType?: string;
    urgencyLevel: number; // 1-10
    keyObservations: string[];
    recommendedActions: string[];
  };
  contentAnalysis: {
    mainSubjects: string[];
    setting: string;
    timeOfDay?: string;
    weatherConditions?: string;
    visibleText?: string[];
    peopleCount?: number;
    vehiclesPresent?: string[];
  };
  technicalAssessment: {
    imageQuality: 'poor' | 'fair' | 'good' | 'excellent';
    clarity: number; // 0-100
    lighting: 'poor' | 'adequate' | 'good' | 'excellent';
    composition: string;
    potentialIssues: string[];
  };
  verificationNotes: {
    authenticityIndicators: string[];
    suspiciousElements: string[];
    overallCredibility: number; // 0-100
  };
}

class OpenAIVisionService {
  private isConfigured: boolean = false;

  constructor() {
    this.isConfigured = openaiService.isServiceConfigured();
    
    if (this.isConfigured) {
      console.log('OpenAI Vision Service initialized');
    } else {
      console.warn('OpenAI Vision Service not configured - using mock descriptions');
    }
  }

  async analyzeImage(imageFile: File): Promise<VisionDescription> {
    if (!this.isConfigured) {
      return this.getMockVisionDescription(imageFile);
    }

    try {
      console.log('Analyzing image with GPT-4 Vision...');
      
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const prompt = `
Analyze this image for emergency response and evidence verification purposes. Provide a comprehensive analysis in the following JSON format:

{
  "description": "Detailed description of what you see in the image",
  "emergencyAssessment": {
    "isEmergency": boolean,
    "emergencyType": "fire|medical|accident|flood|violence|infrastructure|other",
    "urgencyLevel": 1-10,
    "keyObservations": ["observation1", "observation2"],
    "recommendedActions": ["action1", "action2"]
  },
  "contentAnalysis": {
    "mainSubjects": ["subject1", "subject2"],
    "setting": "indoor|outdoor|urban|rural|residential|commercial",
    "timeOfDay": "morning|afternoon|evening|night|unknown",
    "weatherConditions": "clear|cloudy|rainy|snowy|stormy|unknown",
    "visibleText": ["text1", "text2"],
    "peopleCount": number,
    "vehiclesPresent": ["vehicle1", "vehicle2"]
  },
  "technicalAssessment": {
    "imageQuality": "poor|fair|good|excellent",
    "clarity": 0-100,
    "lighting": "poor|adequate|good|excellent",
    "composition": "description of composition",
    "potentialIssues": ["issue1", "issue2"]
  },
  "verificationNotes": {
    "authenticityIndicators": ["indicator1", "indicator2"],
    "suspiciousElements": ["element1", "element2"],
    "overallCredibility": 0-100
  }
}

Focus on emergency indicators, evidence quality, and authenticity markers. Be thorough but concise.`;

      // Use OpenAI's vision capabilities (GPT-4 Vision)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI Vision');
      }

      try {
        // Parse the JSON response
        const analysis = JSON.parse(content);
        return this.validateAndNormalizeResponse(analysis);
      } catch (parseError) {
        console.error('Failed to parse OpenAI Vision response:', parseError);
        // Fallback to text-based analysis
        return this.createFallbackFromText(content, imageFile);
      }
    } catch (error) {
      console.error('OpenAI Vision analysis failed:', error);
      return this.getMockVisionDescription(imageFile);
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private validateAndNormalizeResponse(analysis: any): VisionDescription {
    // Ensure all required fields are present with defaults
    return {
      description: analysis.description || 'Image analysis completed',
      emergencyAssessment: {
        isEmergency: analysis.emergencyAssessment?.isEmergency || false,
        emergencyType: analysis.emergencyAssessment?.emergencyType,
        urgencyLevel: Math.max(1, Math.min(10, analysis.emergencyAssessment?.urgencyLevel || 1)),
        keyObservations: Array.isArray(analysis.emergencyAssessment?.keyObservations) 
          ? analysis.emergencyAssessment.keyObservations 
          : [],
        recommendedActions: Array.isArray(analysis.emergencyAssessment?.recommendedActions)
          ? analysis.emergencyAssessment.recommendedActions
          : []
      },
      contentAnalysis: {
        mainSubjects: Array.isArray(analysis.contentAnalysis?.mainSubjects)
          ? analysis.contentAnalysis.mainSubjects
          : [],
        setting: analysis.contentAnalysis?.setting || 'unknown',
        timeOfDay: analysis.contentAnalysis?.timeOfDay,
        weatherConditions: analysis.contentAnalysis?.weatherConditions,
        visibleText: Array.isArray(analysis.contentAnalysis?.visibleText)
          ? analysis.contentAnalysis.visibleText
          : [],
        peopleCount: analysis.contentAnalysis?.peopleCount,
        vehiclesPresent: Array.isArray(analysis.contentAnalysis?.vehiclesPresent)
          ? analysis.contentAnalysis.vehiclesPresent
          : []
      },
      technicalAssessment: {
        imageQuality: analysis.technicalAssessment?.imageQuality || 'fair',
        clarity: Math.max(0, Math.min(100, analysis.technicalAssessment?.clarity || 70)),
        lighting: analysis.technicalAssessment?.lighting || 'adequate',
        composition: analysis.technicalAssessment?.composition || 'Standard composition',
        potentialIssues: Array.isArray(analysis.technicalAssessment?.potentialIssues)
          ? analysis.technicalAssessment.potentialIssues
          : []
      },
      verificationNotes: {
        authenticityIndicators: Array.isArray(analysis.verificationNotes?.authenticityIndicators)
          ? analysis.verificationNotes.authenticityIndicators
          : [],
        suspiciousElements: Array.isArray(analysis.verificationNotes?.suspiciousElements)
          ? analysis.verificationNotes.suspiciousElements
          : [],
        overallCredibility: Math.max(0, Math.min(100, analysis.verificationNotes?.overallCredibility || 75))
      }
    };
  }

  private createFallbackFromText(content: string, imageFile: File): VisionDescription {
    // Create a basic analysis from text response
    const isEmergencyKeyword = /emergency|urgent|crisis|danger|fire|accident|medical|flood/i.test(content);
    
    return {
      description: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      emergencyAssessment: {
        isEmergency: isEmergencyKeyword,
        urgencyLevel: isEmergencyKeyword ? 6 : 2,
        keyObservations: ['AI analysis completed'],
        recommendedActions: isEmergencyKeyword ? ['Contact emergency services'] : ['Document for records']
      },
      contentAnalysis: {
        mainSubjects: ['Image content'],
        setting: 'unknown'
      },
      technicalAssessment: {
        imageQuality: 'fair',
        clarity: 70,
        lighting: 'adequate',
        composition: 'Standard composition',
        potentialIssues: []
      },
      verificationNotes: {
        authenticityIndicators: ['AI analysis performed'],
        suspiciousElements: [],
        overallCredibility: 75
      }
    };
  }

  private getMockVisionDescription(imageFile: File): VisionDescription {
    console.log('Using mock OpenAI Vision analysis');
    
    const filename = imageFile.name.toLowerCase();
    let isEmergency = false;
    let emergencyType: string | undefined;
    let urgencyLevel = 1;
    let keyObservations: string[] = [];
    let recommendedActions: string[] = [];

    // Analyze filename for context
    if (filename.includes('fire') || filename.includes('smoke')) {
      isEmergency = true;
      emergencyType = 'fire';
      urgencyLevel = 9;
      keyObservations = ['Visible flames and smoke', 'Potential structural damage', 'Emergency response needed'];
      recommendedActions = ['Evacuate area immediately', 'Contact fire department', 'Ensure personnel safety'];
    } else if (filename.includes('medical') || filename.includes('ambulance')) {
      isEmergency = true;
      emergencyType = 'medical';
      urgencyLevel = 8;
      keyObservations = ['Medical emergency in progress', 'Emergency personnel present', 'Urgent care required'];
      recommendedActions = ['Provide immediate medical assistance', 'Clear area for responders', 'Document incident'];
    } else if (filename.includes('accident') || filename.includes('crash')) {
      isEmergency = true;
      emergencyType = 'accident';
      urgencyLevel = 7;
      keyObservations = ['Vehicle accident scene', 'Possible injuries', 'Traffic disruption'];
      recommendedActions = ['Secure the scene', 'Check for injuries', 'Direct traffic safely'];
    } else {
      keyObservations = ['Standard documentation photo', 'No immediate emergency indicators'];
      recommendedActions = ['File for records', 'Continue monitoring situation'];
    }

    return {
      description: `Mock analysis of ${imageFile.name}: This image appears to show ${isEmergency ? 'an emergency situation' : 'a standard documentation scene'}. The image quality is adequate for evidence purposes and shows clear details relevant to the situation.`,
      emergencyAssessment: {
        isEmergency,
        emergencyType,
        urgencyLevel,
        keyObservations,
        recommendedActions
      },
      contentAnalysis: {
        mainSubjects: isEmergency ? ['Emergency scene', 'Response personnel'] : ['Documentation subject'],
        setting: 'outdoor',
        timeOfDay: 'unknown',
        weatherConditions: 'clear',
        visibleText: [],
        peopleCount: isEmergency ? 3 : 1,
        vehiclesPresent: isEmergency ? ['Emergency vehicle'] : []
      },
      technicalAssessment: {
        imageQuality: 'good',
        clarity: 85,
        lighting: 'good',
        composition: 'Well-framed documentation photo with clear subject focus',
        potentialIssues: []
      },
      verificationNotes: {
        authenticityIndicators: ['Consistent lighting', 'Natural shadows', 'Appropriate image quality'],
        suspiciousElements: [],
        overallCredibility: 85
      }
    };
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      model: 'gpt-4-vision-preview',
      capabilities: ['Image analysis', 'Emergency assessment', 'Content verification']
    };
  }
}

export const openaiVisionService = new OpenAIVisionService();
export type { VisionDescription };