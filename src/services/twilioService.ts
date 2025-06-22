interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface SMSAlert {
  to: string;
  message: string;
  emergencyId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class TwilioService {
  private config: TwilioConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
      authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
      fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || '',
    };

    this.isConfigured = !!(this.config.accountSid && this.config.authToken && this.config.fromNumber);
    
    if (this.isConfigured) {
      console.log('Twilio Service initialized successfully');
    } else {
      console.warn('Twilio not configured - SMS alerts will be logged only');
    }
  }

  async sendSMSAlert(alert: SMSAlert): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📱 SMS Alert (Mock):', {
        to: alert.to,
        message: alert.message,
        priority: alert.priority,
        emergencyId: alert.emergencyId,
      });
      return true;
    }

    try {
      const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + this.config.accountSid + '/Messages.json', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(this.config.accountSid + ':' + this.config.authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: alert.to,
          From: this.config.fromNumber,
          Body: alert.message,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('SMS sent successfully:', result.sid);
        return true;
      } else {
        throw new Error(`Twilio API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // Fallback logging
      console.log('📱 SMS Alert (Fallback):', {
        to: alert.to,
        message: alert.message,
        priority: alert.priority,
        emergencyId: alert.emergencyId,
        error: error.message,
      });
      return false;
    }
  }

  async notifyResponders(emergencyReport: any, responderContacts: string[]): Promise<void> {
    const message = `🚨 EMERGENCY ALERT: ${emergencyReport.title} - ${emergencyReport.severity.toUpperCase()} priority. Location: ${emergencyReport.location.lat}, ${emergencyReport.location.lng}. Respond via ProofVault app.`;

    const promises = responderContacts.map(contact => 
      this.sendSMSAlert({
        to: contact,
        message,
        emergencyId: emergencyReport.id,
        priority: emergencyReport.severity,
      })
    );

    await Promise.allSettled(promises);
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const twilioService = new TwilioService();