interface VisionAnalysisResult {
  labels: Array<{
    description: string;
    score: number;
    topicality: number;
  }>;
  safeSearchAnnotation: {
    adult: string;
    spoof: string;
    medical: string;
    violence: string;
    racy: string;
  };
  textAnnotations: Array<{
    description: string;
    boundingPoly: any;
  }>;
  objectAnnotations: Array<{
    name: string;
    score: number;
    boundingPoly: any;
  }>;
  faceAnnotations: Array<{
    boundingPoly: any;
    fdBoundingPoly: any;
    landmarks: any[];
    rollAngle: number;
    panAngle: number;
    tiltAngle: number;
    detectionConfidence: number;
    landmarkingConfidence: number;
    joyLikelihood: string;
    sorrowLikelihood: string;
    angerLikelihood: string;
    surpriseLikelihood: string;
    underExposedLikelihood: string;
    blurredLikelihood: string;
    headwearLikelihood: string;
  }>;
  emergencyContext?: {
    hasEmergencyIndicators: boolean;
    emergencyTypes: string[];
    urgencyLevel: number;
    confidence: number;
  };
}

class GoogleVisionService {
  private apiKey: string;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY || '';
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      console.log('Google Cloud Vision API initialized');
    } else {
      console.warn('Google Cloud Vision API key not configured - using mock analysis');
    }
  }

  async analyzeImage(imageFile: File): Promise<VisionAnalysisResult> {
    if (!this.isConfigured) {
      return this.getMockAnalysis(imageFile);
    }

    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'TEXT_DETECTION' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'FACE_DETECTION', maxResults: 10 }
            ]
          }
        ]
      };

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.responses[0];

      // Process and enhance results with emergency context
      const processedResult = this.processVisionResults(result);
      
      return processedResult;
    } catch (error) {
      console.error('Google Vision API failed:', error);
      return this.getMockAnalysis(imageFile);
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

  private processVisionResults(result: any): VisionAnalysisResult {
    const labels = result.labelAnnotations || [];
    const safeSearch = result.safeSearchAnnotation || {};
    const textAnnotations = result.textAnnotations || [];
    const objectAnnotations = result.localizedObjectAnnotations || [];
    const faceAnnotations = result.faceAnnotations || [];

    // Analyze for emergency context
    const emergencyContext = this.analyzeEmergencyContext(labels, textAnnotations, objectAnnotations);

    return {
      labels: labels.map((label: any) => ({
        description: label.description,
        score: label.score,
        topicality: label.topicality
      })),
      safeSearchAnnotation: {
        adult: safeSearch.adult || 'UNKNOWN',
        spoof: safeSearch.spoof || 'UNKNOWN',
        medical: safeSearch.medical || 'UNKNOWN',
        violence: safeSearch.violence || 'UNKNOWN',
        racy: safeSearch.racy || 'UNKNOWN'
      },
      textAnnotations: textAnnotations.map((text: any) => ({
        description: text.description,
        boundingPoly: text.boundingPoly
      })),
      objectAnnotations: objectAnnotations.map((obj: any) => ({
        name: obj.name,
        score: obj.score,
        boundingPoly: obj.boundingPoly
      })),
      faceAnnotations: faceAnnotations.map((face: any) => ({
        boundingPoly: face.boundingPoly,
        fdBoundingPoly: face.fdBoundingPoly,
        landmarks: face.landmarks || [],
        rollAngle: face.rollAngle || 0,
        panAngle: face.panAngle || 0,
        tiltAngle: face.tiltAngle || 0,
        detectionConfidence: face.detectionConfidence || 0,
        landmarkingConfidence: face.landmarkingConfidence || 0,
        joyLikelihood: face.joyLikelihood || 'UNKNOWN',
        sorrowLikelihood: face.sorrowLikelihood || 'UNKNOWN',
        angerLikelihood: face.angerLikelihood || 'UNKNOWN',
        surpriseLikelihood: face.surpriseLikelihood || 'UNKNOWN',
        underExposedLikelihood: face.underExposedLikelihood || 'UNKNOWN',
        blurredLikelihood: face.blurredLikelihood || 'UNKNOWN',
        headwearLikelihood: face.headwearLikelihood || 'UNKNOWN'
      })),
      emergencyContext
    };
  }

  private analyzeEmergencyContext(labels: any[], textAnnotations: any[], objectAnnotations: any[]): {
    hasEmergencyIndicators: boolean;
    emergencyTypes: string[];
    urgencyLevel: number;
    confidence: number;
  } {
    const emergencyKeywords = {
      fire: ['fire', 'flame', 'smoke', 'burning', 'blaze', 'combustion'],
      medical: ['ambulance', 'hospital', 'injury', 'blood', 'medical', 'emergency'],
      accident: ['crash', 'accident', 'collision', 'wreck', 'damage', 'debris'],
      flood: ['flood', 'water', 'flooding', 'inundation', 'overflow'],
      violence: ['weapon', 'gun', 'knife', 'violence', 'fight', 'assault'],
      infrastructure: ['building', 'collapse', 'damage', 'destruction', 'rubble']
    };

    const detectedTypes: string[] = [];
    let maxConfidence = 0;
    let urgencyLevel = 1;

    // Analyze labels
    labels.forEach(label => {
      Object.entries(emergencyKeywords).forEach(([type, keywords]) => {
        if (keywords.some(keyword => 
          label.description.toLowerCase().includes(keyword.toLowerCase())
        )) {
          if (!detectedTypes.includes(type)) {
            detectedTypes.push(type);
          }
          maxConfidence = Math.max(maxConfidence, label.score);
          
          // Increase urgency for high-confidence emergency indicators
          if (label.score > 0.8) {
            urgencyLevel = Math.max(urgencyLevel, 8);
          } else if (label.score > 0.6) {
            urgencyLevel = Math.max(urgencyLevel, 6);
          }
        }
      });
    });

    // Analyze text content
    textAnnotations.forEach(text => {
      const textContent = text.description.toLowerCase();
      Object.entries(emergencyKeywords).forEach(([type, keywords]) => {
        if (keywords.some(keyword => textContent.includes(keyword))) {
          if (!detectedTypes.includes(type)) {
            detectedTypes.push(type);
          }
          urgencyLevel = Math.max(urgencyLevel, 7);
        }
      });
    });

    // Analyze objects
    objectAnnotations.forEach(obj => {
      Object.entries(emergencyKeywords).forEach(([type, keywords]) => {
        if (keywords.some(keyword => 
          obj.name.toLowerCase().includes(keyword.toLowerCase())
        )) {
          if (!detectedTypes.includes(type)) {
            detectedTypes.push(type);
          }
          maxConfidence = Math.max(maxConfidence, obj.score);
        }
      });
    });

    return {
      hasEmergencyIndicators: detectedTypes.length > 0,
      emergencyTypes: detectedTypes,
      urgencyLevel,
      confidence: maxConfidence
    };
  }

  private getMockAnalysis(imageFile: File): VisionAnalysisResult {
    console.log('Using mock Google Vision analysis');
    
    // Generate realistic mock data based on filename
    const filename = imageFile.name.toLowerCase();
    let mockLabels = [
      { description: 'Photograph', score: 0.95, topicality: 0.95 },
      { description: 'Image', score: 0.90, topicality: 0.90 }
    ];

    let emergencyTypes: string[] = [];
    let urgencyLevel = 1;

    // Add context-specific labels based on filename
    if (filename.includes('fire') || filename.includes('smoke')) {
      mockLabels.push(
        { description: 'Fire', score: 0.88, topicality: 0.92 },
        { description: 'Smoke', score: 0.85, topicality: 0.88 },
        { description: 'Flame', score: 0.82, topicality: 0.85 }
      );
      emergencyTypes.push('fire');
      urgencyLevel = 9;
    } else if (filename.includes('medical') || filename.includes('ambulance')) {
      mockLabels.push(
        { description: 'Medical equipment', score: 0.87, topicality: 0.90 },
        { description: 'Emergency vehicle', score: 0.84, topicality: 0.87 }
      );
      emergencyTypes.push('medical');
      urgencyLevel = 8;
    } else if (filename.includes('accident') || filename.includes('crash')) {
      mockLabels.push(
        { description: 'Vehicle', score: 0.89, topicality: 0.91 },
        { description: 'Accident', score: 0.86, topicality: 0.88 },
        { description: 'Damage', score: 0.83, topicality: 0.85 }
      );
      emergencyTypes.push('accident');
      urgencyLevel = 7;
    } else {
      // Generic scene labels
      mockLabels.push(
        { description: 'Outdoor', score: 0.78, topicality: 0.80 },
        { description: 'Building', score: 0.75, topicality: 0.77 },
        { description: 'Street', score: 0.72, topicality: 0.74 }
      );
    }

    return {
      labels: mockLabels,
      safeSearchAnnotation: {
        adult: 'VERY_UNLIKELY',
        spoof: 'UNLIKELY',
        medical: emergencyTypes.includes('medical') ? 'LIKELY' : 'UNLIKELY',
        violence: emergencyTypes.includes('violence') ? 'POSSIBLE' : 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY'
      },
      textAnnotations: [
        {
          description: 'EMERGENCY\nCALL 911',
          boundingPoly: { vertices: [{ x: 100, y: 50 }, { x: 200, y: 50 }, { x: 200, y: 100 }, { x: 100, y: 100 }] }
        }
      ],
      objectAnnotations: [
        {
          name: 'Person',
          score: 0.85,
          boundingPoly: { normalizedVertices: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.2 }, { x: 0.4, y: 0.8 }, { x: 0.1, y: 0.8 }] }
        }
      ],
      faceAnnotations: [
        {
          boundingPoly: { vertices: [{ x: 150, y: 200 }, { x: 250, y: 200 }, { x: 250, y: 300 }, { x: 150, y: 300 }] },
          fdBoundingPoly: { vertices: [{ x: 155, y: 205 }, { x: 245, y: 205 }, { x: 245, y: 295 }, { x: 155, y: 295 }] },
          landmarks: [],
          rollAngle: 2.5,
          panAngle: -1.2,
          tiltAngle: 0.8,
          detectionConfidence: 0.92,
          landmarkingConfidence: 0.88,
          joyLikelihood: 'VERY_UNLIKELY',
          sorrowLikelihood: 'LIKELY',
          angerLikelihood: 'UNLIKELY',
          surpriseLikelihood: 'POSSIBLE',
          underExposedLikelihood: 'VERY_UNLIKELY',
          blurredLikelihood: 'UNLIKELY',
          headwearLikelihood: 'VERY_UNLIKELY'
        }
      ],
      emergencyContext: {
        hasEmergencyIndicators: emergencyTypes.length > 0,
        emergencyTypes,
        urgencyLevel,
        confidence: emergencyTypes.length > 0 ? 0.85 : 0.15
      }
    };
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      hasApiKey: !!this.apiKey,
      keyLength: this.apiKey.length,
    };
  }
}

export const googleVisionService = new GoogleVisionService();
export type { VisionAnalysisResult };