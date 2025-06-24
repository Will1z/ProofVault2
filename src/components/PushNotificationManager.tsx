import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseService } from '../services/firebaseService';
import toast from 'react-hot-toast';

interface PushNotificationManagerProps {
  userId?: string;
  className?: string;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  userId,
  className = ''
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRegistered, setIsRegistered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    emergencyAlerts: true,
    verificationUpdates: true,
    responderAssignments: true,
    systemAnnouncements: false
  });

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = () => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      return;
    }

    setPermissionStatus(Notification.permission);
    
    // Check if already registered
    const token = localStorage.getItem('fcmToken');
    if (token) {
      setIsRegistered(true);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await firebaseService.requestNotificationPermission();
      
      if (granted) {
        setPermissionStatus('granted');
        registerForPushNotifications();
      } else {
        setPermissionStatus('denied');
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
    }
  };

  const registerForPushNotifications = async () => {
    try {
      const token = await firebaseService.getRegistrationToken();
      
      if (token) {
        // Store token in localStorage
        localStorage.setItem('fcmToken', token);
        setIsRegistered(true);
        
        // In a real app, send token to your backend
        console.log('FCM token registered:', token);
        
        // Show success notification
        toast.success('Push notifications enabled');
        
        // Send test notification
        setTimeout(() => {
          firebaseService.notifySystemAlert(
            'Notifications Enabled',
            'You will now receive important alerts and updates',
            'low'
          );
        }, 2000);
      } else {
        toast.error('Failed to register for push notifications');
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      toast.error('Failed to register for push notifications');
    }
  };

  const toggleNotificationPreference = (key: keyof typeof notificationPreferences) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const sendTestNotification = async () => {
    try {
      await firebaseService.notifySystemAlert(
        'Test Notification',
        'This is a test notification from ProofVault',
        'medium'
      );
      toast.success('Test notification sent');
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  if (permissionStatus === 'unsupported') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <BellOff className="h-5 w-5 text-gray-500" />
          <div>
            <h3 className="font-medium text-gray-900">Push Notifications Unsupported</h3>
            <p className="text-sm text-gray-600">Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {permissionStatus === 'granted' ? (
              <Bell className="h-5 w-5 text-blue-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-500" />
            )}
            <h3 className="font-medium text-gray-900">Push Notifications</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {permissionStatus === 'granted' && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <CheckCircle2 className="h-3 w-3" />
                <span>Enabled</span>
              </div>
            )}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showSettings ? 'Hide Settings' : 'Settings'}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Permission Status */}
              <div className={`p-3 rounded-lg ${
                permissionStatus === 'granted' ? 'bg-green-50 border border-green-200' :
                permissionStatus === 'denied' ? 'bg-red-50 border border-red-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {permissionStatus === 'granted' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : permissionStatus === 'denied' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Bell className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    permissionStatus === 'granted' ? 'text-green-800' :
                    permissionStatus === 'denied' ? 'text-red-800' :
                    'text-yellow-800'
                  }`}>
                    {permissionStatus === 'granted' ? 'Notifications Enabled' :
                     permissionStatus === 'denied' ? 'Notifications Blocked' :
                     'Notifications Not Enabled'}
                  </span>
                </div>
                
                {permissionStatus !== 'granted' && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      {permissionStatus === 'denied' 
                        ? 'You have blocked notifications. Please update your browser settings to enable notifications.'
                        : 'Enable notifications to receive important alerts about emergencies, verification updates, and responder assignments.'}
                    </p>
                    {permissionStatus === 'default' && (
                      <button
                        onClick={requestPermission}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Enable Notifications
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Notification Preferences */}
              {permissionStatus === 'granted' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Notification Preferences</h4>
                  <div className="space-y-2">
                    {Object.entries(notificationPreferences).map(([key, enabled]) => (
                      <div key={key} className="flex items-center justify-between">
                        <label htmlFor={key} className="text-sm text-gray-700 flex items-center space-x-2">
                          {key === 'emergencyAlerts' && (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          {key === 'verificationUpdates' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {key === 'responderAssignments' && (
                            <Zap className="h-4 w-4 text-blue-600" />
                          )}
                          {key === 'systemAnnouncements' && (
                            <Bell className="h-4 w-4 text-gray-600" />
                          )}
                          <span>
                            {key === 'emergencyAlerts' ? 'Emergency Alerts' :
                             key === 'verificationUpdates' ? 'Verification Updates' :
                             key === 'responderAssignments' ? 'Responder Assignments' :
                             'System Announcements'}
                          </span>
                        </label>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input
                            type="checkbox"
                            id={key}
                            checked={enabled}
                            onChange={() => toggleNotificationPreference(key as any)}
                            className="sr-only"
                          />
                          <div className="w-10 h-5 bg-gray-200 rounded-full shadow-inner"></div>
                          <div className={`absolute w-5 h-5 rounded-full transition-transform ${
                            enabled ? 'transform translate-x-5 bg-blue-600' : 'bg-white'
                          }`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Test Notification */}
              {permissionStatus === 'granted' && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={sendTestNotification}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Send Test Notification
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PushNotificationManager;