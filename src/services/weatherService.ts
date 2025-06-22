interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  description: string;
  icon: string;
  alerts?: WeatherAlert[];
}

interface WeatherAlert {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: Date;
  end: Date;
}

class WeatherService {
  private apiKey: string;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'f691c216bc7f2604284bc9ff6f8162d9';
    this.isConfigured = !!this.apiKey && this.apiKey.length > 10; // Basic validation

    if (this.isConfigured) {
      console.log('Weather Service initialized with OpenWeatherMap API key');
    } else {
      console.warn('OpenWeatherMap API key not configured or invalid - using mock weather data');
    }
  }

  async getWeatherForLocation(lat: number, lng: number): Promise<WeatherData> {
    if (!this.isConfigured) {
      console.log('Using mock weather data - API key not configured');
      return this.getMockWeatherData();
    }

    try {
      console.log(`Fetching weather for location: ${lat}, ${lng}`);
      
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Weather API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        
        if (response.status === 401) {
          throw new Error(`Weather API authentication failed. Please check your API key. Status: ${response.status}`);
        } else if (response.status === 429) {
          throw new Error(`Weather API rate limit exceeded. Status: ${response.status}`);
        } else {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Get weather alerts (optional - may fail)
      let alerts: WeatherAlert[] = [];
      try {
        const alertsResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&appid=${this.apiKey}&exclude=minutely,hourly,daily`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          alerts = alertsData.alerts?.map((alert: any) => ({
            title: alert.event,
            description: alert.description,
            severity: this.mapSeverity(alert.tags?.[0] || 'moderate'),
            start: new Date(alert.start * 1000),
            end: new Date(alert.end * 1000),
          })) || [];
        }
      } catch (alertError) {
        console.warn('Weather alerts fetch failed (non-critical):', alertError);
      }

      return {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed || 0),
        visibility: Math.round((data.visibility || 10000) / 1000), // Convert to km
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        alerts,
      };
    } catch (error) {
      console.error('Weather API failed:', error);
      
      // Always fall back to mock data
      return this.getMockWeatherData();
    }
  }

  private getMockWeatherData(): WeatherData {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Fog'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    console.log('Returning mock weather data');
    
    return {
      temperature: Math.round(Math.random() * 30 + 5), // 5-35°C
      condition,
      humidity: Math.round(Math.random() * 100),
      windSpeed: Math.round(Math.random() * 20),
      visibility: Math.round(Math.random() * 10 + 1),
      pressure: Math.round(Math.random() * 50 + 1000),
      description: condition.toLowerCase(),
      icon: '01d',
      alerts: Math.random() > 0.8 ? [{
        title: 'Severe Weather Warning',
        description: 'Strong winds and heavy rain expected',
        severity: 'severe' as const,
        start: new Date(),
        end: new Date(Date.now() + 6 * 60 * 60 * 1000),
      }] : [],
    };
  }

  private mapSeverity(tag: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    switch (tag?.toLowerCase()) {
      case 'minor': return 'minor';
      case 'moderate': return 'moderate';
      case 'severe': return 'severe';
      case 'extreme': return 'extreme';
      default: return 'moderate';
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      apiKey: this.apiKey ? '********' : 'Not set',
      keyLength: this.apiKey.length,
    };
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, WeatherAlert };