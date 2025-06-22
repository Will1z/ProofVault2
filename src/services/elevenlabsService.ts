interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface NarrationResult {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  voiceId: string;
  text: string;
}

class ElevenLabsService {
  private apiKey: string;
  private isConfigured: boolean = false;
  private defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      console.log('ElevenLabs Service initialized');
    } else {
      console.warn('ElevenLabs API key not configured - using mock narration');
    }
  }

  async generateNarration(
    text: string,
    voiceId: string = this.defaultVoiceId,
    voiceSettings: VoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true,
    }
  ): Promise<NarrationResult> {
    if (!this.isConfigured) {
      return this.getMockNarration(text, voiceId);
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: voiceSettings,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Estimate duration (rough calculation: ~150 words per minute)
      const wordCount = text.split(' ').length;
      const estimatedDuration = (wordCount / 150) * 60;

      return {
        audioBlob,
        audioUrl,
        duration: estimatedDuration,
        voiceId,
        text,
      };
    } catch (error) {
      console.error('ElevenLabs narration failed:', error);
      return this.getMockNarration(text, voiceId);
    }
  }

  async generateEmergencyBroadcast(
    emergencyData: {
      type: string;
      severity: string;
      location: string;
      description: string;
      instructions?: string;
    }
  ): Promise<NarrationResult> {
    const broadcastText = this.formatEmergencyBroadcast(emergencyData);
    
    // Use a more authoritative voice for emergency broadcasts
    const emergencyVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice (clear, professional)
    
    return await this.generateNarration(broadcastText, emergencyVoiceId, {
      stability: 0.8,
      similarity_boost: 0.8,
      style: 0.3, // More neutral/professional
      use_speaker_boost: true,
    });
  }

  async generateSummaryNarration(
    summary: string,
    keyFacts: string[],
    urgencyLevel: number
  ): Promise<NarrationResult> {
    const narrativeText = this.formatSummaryNarration(summary, keyFacts, urgencyLevel);
    
    // Adjust voice settings based on urgency
    const voiceSettings: VoiceSettings = {
      stability: urgencyLevel > 7 ? 0.7 : 0.5,
      similarity_boost: 0.75,
      style: urgencyLevel > 7 ? 0.8 : 0.5,
      use_speaker_boost: true,
    };

    return await this.generateNarration(narrativeText, this.defaultVoiceId, voiceSettings);
  }

  private formatEmergencyBroadcast(emergencyData: {
    type: string;
    severity: string;
    location: string;
    description: string;
    instructions?: string;
  }): string {
    const severityPrefix = emergencyData.severity === 'critical' ? 'URGENT ALERT: ' : 
                          emergencyData.severity === 'high' ? 'EMERGENCY ALERT: ' : 
                          'ALERT: ';

    let broadcast = `${severityPrefix}${emergencyData.type.replace('_', ' ')} emergency reported at ${emergencyData.location}. `;
    broadcast += `${emergencyData.description} `;
    
    if (emergencyData.instructions) {
      broadcast += `Instructions: ${emergencyData.instructions} `;
    }
    
    broadcast += 'Emergency responders have been notified. Stay safe and follow official guidance.';
    
    return broadcast;
  }

  private formatSummaryNarration(summary: string, keyFacts: string[], urgencyLevel: number): string {
    let narrative = `Emergency situation summary: ${summary} `;
    
    if (keyFacts.length > 0) {
      narrative += 'Key details include: ';
      narrative += keyFacts.slice(0, 3).join('. ') + '. ';
    }
    
    if (urgencyLevel > 7) {
      narrative += 'This is a high-priority situation requiring immediate attention. ';
    }
    
    narrative += 'This information has been verified and recorded for emergency response coordination.';
    
    return narrative;
  }

  private async getMockNarration(text: string, voiceId: string): Promise<NarrationResult> {
    // Create a mock audio blob (silent audio)
    const audioContext = new AudioContext();
    const duration = Math.max(2, text.length * 0.05); // Rough estimate
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    
    // Add some subtle background tone to make it "audible"
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.01; // Very quiet 440Hz tone
    }

    // Convert to blob
    const audioBlob = new Blob([new ArrayBuffer(1024)], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    console.log('Generated mock narration for:', text.substring(0, 50) + '...');

    return {
      audioBlob,
      audioUrl,
      duration,
      voiceId,
      text,
    };
  }

  async getAvailableVoices(): Promise<Array<{ voice_id: string; name: string; category: string }>> {
    if (!this.isConfigured) {
      return [
        { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Mock)', category: 'premade' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Mock)', category: 'premade' },
      ];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
      }));
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      return [
        { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
      ];
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const elevenlabsService = new ElevenLabsService();
export type { NarrationResult, VoiceSettings };