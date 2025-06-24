import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import toast from 'react-hot-toast';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class FirebaseService {
  private app: any = null;
  private messaging: any = null;
  private isConfigured: boolean = false;
  private isSupported: boolean = false;
  private config: FirebaseConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    };

    this.isConfigured = !!(
      this.config.apiKey && 
      this.config.projectId && 
      this.config.messagingSenderId && 
      this.config.appId &&
      this.config.vapidKey
    );

    if (this.isConfigured) {
      this.initializeFirebase();
    } else {
      console.warn('Firebase not configured - push notifications will be mocked');
    }
  }

  private async initializeFirebase() {
    try {
      // Check if messaging is supported
      this.isSupported = await isSupported();
      
      if (!this.isSupported) {
        console.warn('Firebase messaging not supported in this browser');
        return;
      }

      // Initialize Firebase
      this.app = initializeApp(this.config);
      this.messaging = getMessaging(this.app);

      // Set up message listener
      onMessage(this.messaging, (payload) => {
        console.log('Foreground message received:', payload);
        this.handleForegroundMessage(payload);
      });

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      this.isConfigured = false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isConfigured || !this.isSupported) {
      console.log('Simulating notification permission request');
      return true; // Mock success
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getRegistrationToken(): Promise<string | null> {
    if (!this.isConfigured || !this.isSupported || !this.messaging) {
      console.log('Returning mock FCM token');
      return `mock_token_${Date.now()}`;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: this.config.vapidKey
      });
      
      if (token) {
        console.log('FCM registration token:', token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting registration token:', error);
      return null;
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.isConfigured) {
      return this.mockNotification(payload);
    }

    try {
      // In a real implementation, this would send to your backend
      // which would then use the Firebase Admin SDK to send the notification
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return this.mockNotification(payload);
    }
  }

  private mockNotification(payload: NotificationPayload): boolean {
    console.log('📱 Mock Push Notification:', payload);
    
    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/vite.svg',
        badge: payload.badge || '/vite.svg',
        data: payload.data,
        actions: payload.actions,
        requireInteraction: true,
        tag: 'proofvault-notification'
      });
    } else {
      // Fallback to toast notification
      toast.success(`${payload.title}: ${payload.body}`);
    }
    
    return true;
  }

  private handleForegroundMessage(payload: any) {
    const notification = payload.notification;
    const data = payload.data;

    if (notification) {
      // Show custom notification UI or toast
      toast.success(`${notification.title}: ${notification.body}`, {
        duration: 6000,
        icon: '🔔',
      });

      // Handle notification data
      if (data) {
        this.handleNotificationData(data);
      }
    }
  }

  private handleNotificationData(data: Record<string, any>) {
    // Handle different types of notifications
    switch (data.type) {
      case 'emergency_report':
        console.log('Emergency report notification:', data);
        // Could trigger navigation or update UI
        break;
      case 'verification_complete':
        console.log('Verification complete notification:', data);
        break;
      case 'responder_assigned':
        console.log('Responder assigned notification:', data);
        break;
      default:
        console.log('Unknown notification type:', data);
    }
  }

  // Predefined notification templates for common scenarios
  async notifyEmergencyReportSubmitted(reportId: string, reportTitle: string): Promise<boolean> {
    return this.sendNotification({
      title: '🚨 Emergency Report Submitted',
      body: `Your emergency report "${reportTitle}" has been submitted and responders have been notified.`,
      icon: '/vite.svg',
      data: {
        type: 'emergency_report',
        reportId,
        action: 'view_report'
      },
      actions: [
        {
          action: 'view_report',
          title: 'View Report'
        },
        {
          action: 'track_responders',
          title: 'Track Responders'
        }
      ]
    });
  }

  async notifyResponderAssigned(reportId: string, responderName: string): Promise<boolean> {
    return this.sendNotification({
      title: '👨‍🚒 Responder Assigned',
      body: `${responderName} has been assigned to your emergency report and is en route.`,
      icon: '/vite.svg',
      data: {
        type: 'responder_assigned',
        reportId,
        responderName
      },
      actions: [
        {
          action: 'track_responder',
          title: 'Track Responder'
        },
        {
          action: 'open_chat',
          title: 'Open Chat'
        }
      ]
    });
  }

  async notifyVerificationComplete(proofId: string, trustScore: number): Promise<boolean> {
    const isHighTrust = trustScore >= 80;
    
    return this.sendNotification({
      title: isHighTrust ? '✅ Verification Complete' : '⚠️ Verification Flagged',
      body: `Your evidence has been verified with a ${trustScore}% trust score.`,
      icon: '/vite.svg',
      data: {
        type: 'verification_complete',
        proofId,
        trustScore
      },
      actions: [
        {
          action: 'view_verification',
          title: 'View Details'
        }
      ]
    });
  }

  async notifyExpertCoSignature(proofId: string, organizationName: string): Promise<boolean> {
    return this.sendNotification({
      title: '🏛️ Expert Verification',
      body: `${organizationName} has co-signed your evidence, increasing its credibility.`,
      icon: '/vite.svg',
      data: {
        type: 'expert_cosignature',
        proofId,
        organizationName
      },
      actions: [
        {
          action: 'view_proof',
          title: 'View Proof'
        }
      ]
    });
  }

  async notifySystemAlert(title: string, message: string, urgency: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    const icons = {
      low: '💡',
      medium: '⚠️',
      high: '🚨'
    };

    return this.sendNotification({
      title: `${icons[urgency]} ${title}`,
      body: message,
      icon: '/vite.svg',
      data: {
        type: 'system_alert',
        urgency
      }
    });
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }

  isMessagingSupported(): boolean {
    return this.isSupported;
  }

  getServiceInfo() {
    return {
      configured: this.isConfigured,
      supported: this.isSupported,
      projectId: this.config.projectId,
      hasVapidKey: !!this.config.vapidKey,
      permissionStatus: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    };
  }
}

export const firebaseService = new FirebaseService();
export type { NotificationPayload };