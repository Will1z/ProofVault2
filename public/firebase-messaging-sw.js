// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with your config
// Note: In production, you would use environment variables
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data,
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
    requireInteraction: true,
    tag: 'proofvault-notification'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  // Handle action clicks
  if (event.action) {
    console.log('Action clicked:', event.action);
    
    // Handle different actions
    switch (event.action) {
      case 'view_report':
        // Open report page
        clients.openWindow(`/emergency?reportId=${event.notification.data.reportId}`);
        break;
      case 'track_responders':
        // Open responder tracking page
        clients.openWindow(`/responder?reportId=${event.notification.data.reportId}`);
        break;
      case 'view_verification':
        // Open verification details
        clients.openWindow(`/verification?reportId=${event.notification.data.reportId}`);
        break;
      case 'view_proof':
        // Open proof details
        clients.openWindow(`/proof/${event.notification.data.proofId}`);
        break;
      default:
        // Default action - open app
        clients.openWindow('/');
    }
    
    return;
  }

  // Default behavior - focus or open main window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  
  // Re-subscribe with new subscription
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        console.log('New subscription:', subscription);
        
        // Send new subscription to server
        // In a real implementation, you would send this to your backend
        return fetch('/api/update-push-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription }),
        });
      })
  );
});