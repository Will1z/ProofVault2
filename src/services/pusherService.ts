import Pusher from 'pusher-js';

interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
}

interface EmergencyUpdate {
  type: 'new_report' | 'status_update' | 'responder_assigned' | 'message_received';
  reportId?: string;
  threadId?: string;
  data: any;
  timestamp: Date;
}

class PusherService {
  private pusher: Pusher | null = null;
  private config: PusherConfig;
  private isConfigured: boolean = false;
  private subscribedChannels: Set<string> = new Set();
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 2; // Reduced to fail faster
  private isConnecting: boolean = false;
  private configurationError: string | null = null;
  private hasTriedConnection: boolean = false;
  private mockMode: boolean = false;

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_PUSHER_APP_ID || '',
      key: import.meta.env.VITE_PUSHER_KEY || '',
      secret: import.meta.env.VITE_PUSHER_SECRET || '',
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
    };

    // Validate configuration before attempting connection
    const validationResult = this.validateConfig();
    if (validationResult.isValid) {
      // Don't initialize immediately - wait for first subscription attempt
      console.log('Pusher configuration appears valid - will attempt connection on first subscription');
    } else {
      this.configurationError = validationResult.error;
      this.mockMode = true;
      console.warn('Pusher configuration invalid - using mock mode for real-time features');
      console.warn(validationResult.error);
    }
  }

  private validateConfig(): { isValid: boolean; error?: string } {
    if (!this.config.key || this.config.key.trim() === '') {
      return {
        isValid: false,
        error: 'VITE_PUSHER_KEY is missing. Please add it to your .env file. Get your key from https://dashboard.pusher.com/'
      };
    }

    if (!this.config.cluster || this.config.cluster.trim() === '') {
      return {
        isValid: false,
        error: 'VITE_PUSHER_CLUSTER is missing. Please add it to your .env file (e.g., us2, eu, ap1, etc.)'
      };
    }

    // Basic validation for key format (Pusher keys are typically alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(this.config.key)) {
      return {
        isValid: false,
        error: 'VITE_PUSHER_KEY appears to be invalid format. Pusher keys should contain only letters and numbers.'
      };
    }

    // Check if using placeholder values
    if (this.config.key === 'your_pusher_key_here' || this.config.key === 'YOUR_PUSHER_KEY') {
      return {
        isValid: false,
        error: 'VITE_PUSHER_KEY appears to be a placeholder. Please replace with your actual Pusher key from https://dashboard.pusher.com/'
      };
    }

    if (this.config.cluster === 'your_cluster_here' || this.config.cluster === 'YOUR_CLUSTER') {
      return {
        isValid: false,
        error: 'VITE_PUSHER_CLUSTER appears to be a placeholder. Please replace with your actual cluster (e.g., us2, eu, ap1)'
      };
    }

    return { isValid: true };
  }

  private async initializePusher(): Promise<boolean> {
    if (this.isConnecting || this.connectionAttempts >= this.maxConnectionAttempts || this.mockMode) {
      return false;
    }

    this.isConnecting = true;
    this.connectionAttempts++;
    this.hasTriedConnection = true;

    return new Promise((resolve) => {
      try {
        console.log(`Attempting Pusher connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);

        this.pusher = new Pusher(this.config.key, {
          cluster: this.config.cluster,
          encrypted: true,
          enabledTransports: ['ws', 'wss'],
          disabledTransports: [],
          enableStats: false,
          enableLogging: false,
          // Add connection timeout
          activityTimeout: 30000,
          pongTimeout: 6000,
        });

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          console.warn('Pusher connection timeout - switching to mock mode');
          this.handleConnectionFailure('Connection timeout');
          resolve(false);
        }, 10000); // 10 second timeout

        this.pusher.connection.bind('connected', () => {
          clearTimeout(connectionTimeout);
          console.log('Pusher connected successfully');
          this.isConfigured = true;
          this.isConnecting = false;
          this.connectionAttempts = 0;
          this.configurationError = null;
          this.mockMode = false;
          resolve(true);
        });

        this.pusher.connection.bind('error', (error: any) => {
          clearTimeout(connectionTimeout);
          console.error('Pusher connection error:', error);
          this.isConnecting = false;
          
          let errorMessage = 'Unknown Pusher connection error';
          
          // Handle specific error codes
          if (error.data && error.data.code) {
            switch (error.data.code) {
              case 1006:
                errorMessage = 'Invalid Pusher credentials. The application key or cluster is incorrect. Please verify your VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER in your .env file match your app settings from https://dashboard.pusher.com/';
                break;
              case 4001:
                errorMessage = 'Pusher application does not exist or is disabled. Please check your app settings at https://dashboard.pusher.com/';
                break;
              case 4004:
                errorMessage = 'Pusher application is over connection quota. Please upgrade your plan or check usage at https://dashboard.pusher.com/';
                break;
              case 4100:
                errorMessage = 'Invalid Pusher application key. Please verify VITE_PUSHER_KEY in your .env file matches your app key from https://dashboard.pusher.com/';
                break;
              default:
                errorMessage = `Pusher Error ${error.data.code}: ${error.data.message || 'Unknown error'}`;
            }
          }

          this.handleConnectionFailure(errorMessage);
          resolve(false);
        });

        this.pusher.connection.bind('disconnected', () => {
          clearTimeout(connectionTimeout);
          console.log('Pusher disconnected');
          this.isConnecting = false;
        });

        this.pusher.connection.bind('unavailable', () => {
          clearTimeout(connectionTimeout);
          console.warn('Pusher connection unavailable');
          this.handleConnectionFailure('Connection unavailable');
          resolve(false);
        });

        this.pusher.connection.bind('failed', () => {
          clearTimeout(connectionTimeout);
          console.error('Pusher connection failed');
          this.handleConnectionFailure('Connection failed');
          resolve(false);
        });

      } catch (error) {
        console.error('Failed to initialize Pusher:', error);
        this.handleConnectionFailure(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
        resolve(false);
      }
    });
  }

  private handleConnectionFailure(errorMessage: string) {
    this.isConfigured = false;
    this.isConnecting = false;
    this.configurationError = errorMessage;
    this.mockMode = true;
    
    // Clean up pusher instance
    if (this.pusher) {
      try {
        this.pusher.disconnect();
      } catch (e) {
        // Ignore cleanup errors
      }
      this.pusher = null;
    }
    
    console.warn(`Pusher connection failed: ${errorMessage}`);
    console.warn('Switching to mock mode for real-time features');
  }

  // Subscribe to emergency updates for a specific region or global
  async subscribeToEmergencyUpdates(
    region: string = 'global',
    callback: (update: EmergencyUpdate) => void
  ): Promise<() => void> {
    // Try to initialize Pusher if not already tried and not in mock mode
    if (!this.hasTriedConnection && !this.mockMode) {
      const connected = await this.initializePusher();
      if (!connected) {
        return this.mockSubscription(callback);
      }
    }

    if (!this.isConfigured || !this.pusher || this.mockMode) {
      return this.mockSubscription(callback);
    }

    const channelName = `emergency-updates-${region}`;
    
    try {
      const channel = this.pusher.subscribe(channelName);
      this.subscribedChannels.add(channelName);

      // Bind to different event types
      channel.bind('new-report', (data: any) => {
        callback({
          type: 'new_report',
          reportId: data.reportId,
          data,
          timestamp: new Date(data.timestamp),
        });
      });

      channel.bind('status-update', (data: any) => {
        callback({
          type: 'status_update',
          reportId: data.reportId,
          data,
          timestamp: new Date(data.timestamp),
        });
      });

      channel.bind('responder-assigned', (data: any) => {
        callback({
          type: 'responder_assigned',
          reportId: data.reportId,
          data,
          timestamp: new Date(data.timestamp),
        });
      });

      console.log(`Subscribed to emergency updates: ${channelName}`);

      // Return unsubscribe function
      return () => {
        if (this.pusher) {
          this.pusher.unsubscribe(channelName);
          this.subscribedChannels.delete(channelName);
          console.log(`Unsubscribed from: ${channelName}`);
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to emergency updates:', error);
      return this.mockSubscription(callback);
    }
  }

  // Subscribe to chat messages for a specific thread
  async subscribeToChatMessages(
    threadId: string,
    callback: (message: any) => void
  ): Promise<() => void> {
    // Try to initialize Pusher if not already tried and not in mock mode
    if (!this.hasTriedConnection && !this.mockMode) {
      await this.initializePusher();
    }

    if (!this.isConfigured || !this.pusher || this.mockMode) {
      console.warn('Pusher not available - chat messages will work but without real-time updates');
      return () => {};
    }

    const channelName = `chat-${threadId}`;
    
    try {
      const channel = this.pusher.subscribe(channelName);
      this.subscribedChannels.add(channelName);

      channel.bind('new-message', (data: any) => {
        callback({
          ...data,
          timestamp: new Date(data.timestamp),
        });
      });

      channel.bind('message-updated', (data: any) => {
        callback({
          ...data,
          timestamp: new Date(data.timestamp),
          isUpdate: true,
        });
      });

      console.log(`Subscribed to chat: ${channelName}`);

      return () => {
        if (this.pusher) {
          this.pusher.unsubscribe(channelName);
          this.subscribedChannels.delete(channelName);
          console.log(`Unsubscribed from chat: ${channelName}`);
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to chat:', error);
      return () => {};
    }
  }

  // Subscribe to responder location updates
  async subscribeToResponderUpdates(
    region: string = 'global',
    callback: (update: any) => void
  ): Promise<() => void> {
    // Try to initialize Pusher if not already tried and not in mock mode
    if (!this.hasTriedConnection && !this.mockMode) {
      await this.initializePusher();
    }

    if (!this.isConfigured || !this.pusher || this.mockMode) {
      console.warn('Pusher not available - responder updates will work but without real-time updates');
      return () => {};
    }

    const channelName = `responders-${region}`;
    
    try {
      const channel = this.pusher.subscribe(channelName);
      this.subscribedChannels.add(channelName);

      channel.bind('location-update', callback);
      channel.bind('availability-change', callback);
      channel.bind('responder-online', callback);
      channel.bind('responder-offline', callback);

      console.log(`Subscribed to responder updates: ${channelName}`);

      return () => {
        if (this.pusher) {
          this.pusher.unsubscribe(channelName);
          this.subscribedChannels.delete(channelName);
        }
      };
    } catch (error) {
      console.error('Failed to subscribe to responder updates:', error);
      return () => {};
    }
  }

  // Trigger an event (requires server-side implementation)
  async triggerEvent(
    channel: string,
    event: string,
    data: any
  ): Promise<boolean> {
    if (!this.isConfigured || this.mockMode) {
      console.warn('Pusher not available - cannot trigger real-time events');
      return false;
    }

    try {
      // In a real implementation, you would send this to your backend
      // which would then trigger the event using the Pusher server SDK
      const response = await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          event,
          data: {
            ...data,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
      return false;
    }
  }

  // Mock subscription for when Pusher is not configured
  private mockSubscription(callback: (update: EmergencyUpdate) => void): () => void {
    console.log('Using mock real-time updates - configure Pusher for live updates');
    
    // Simulate periodic updates less frequently to avoid spam
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance every 30 seconds
        const mockUpdate: EmergencyUpdate = {
          type: 'new_report',
          reportId: `mock_${Date.now()}`,
          data: {
            title: 'Mock Emergency Update',
            severity: 'medium',
            location: { lat: 40.7128, lng: -74.0060 },
          },
          timestamp: new Date(),
        };
        callback(mockUpdate);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      console.log('Mock subscription cancelled');
    };
  }

  // Get connection status
  getConnectionState(): string {
    if (this.mockMode) return 'mock';
    if (!this.pusher) return 'unavailable';
    return this.pusher.connection.state;
  }

  // Disconnect from Pusher
  disconnect(): void {
    if (this.pusher) {
      this.subscribedChannels.forEach(channel => {
        this.pusher!.unsubscribe(channel);
      });
      this.subscribedChannels.clear();
      this.pusher.disconnect();
      console.log('Pusher disconnected');
    }
  }

  // Check if service is configured
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  // Get configuration error if any
  getConfigurationError(): string | null {
    return this.configurationError;
  }

  // Check if in mock mode
  isInMockMode(): boolean {
    return this.mockMode;
  }

  // Retry connection if it failed
  async retryConnection(): Promise<boolean> {
    if (this.mockMode && this.connectionAttempts < this.maxConnectionAttempts) {
      console.log('Retrying Pusher connection...');
      this.configurationError = null;
      this.mockMode = false;
      this.connectionAttempts = 0;
      return await this.initializePusher();
    }
    return false;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      mockMode: this.mockMode,
      cluster: this.config.cluster,
      connectionState: this.getConnectionState(),
      subscribedChannels: Array.from(this.subscribedChannels),
      connectionAttempts: this.connectionAttempts,
      maxConnectionAttempts: this.maxConnectionAttempts,
      configurationError: this.configurationError,
      hasValidKey: !!this.config.key && this.config.key.length > 0,
      hasValidCluster: !!this.config.cluster && this.config.cluster.length > 0,
      hasTriedConnection: this.hasTriedConnection,
    };
  }

  // Method to help users set up Pusher
  getSetupInstructions(): string {
    return `
To set up Pusher real-time features:

1. Go to https://dashboard.pusher.com/ and create a free account
2. Create a new app or select an existing one
3. Go to "App Keys" section
4. Copy your app_key and cluster
5. Update your .env file with the correct values:
   VITE_PUSHER_KEY=your_actual_app_key
   VITE_PUSHER_CLUSTER=your_actual_cluster
6. Restart your development server

Current status: ${this.mockMode ? 'Mock mode (Pusher unavailable)' : (this.configurationError || 'Not configured')}

Note: The app will continue to work normally in mock mode, but real-time features will be simulated.
    `.trim();
  }
}

export const pusherService = new PusherService();
export type { EmergencyUpdate };