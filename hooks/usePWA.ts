import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  notificationPermission: NotificationPermission;
  swRegistration: ServiceWorkerRegistration | null;
}

interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOffline: !navigator.onLine,
    notificationPermission: 'default',
    swRegistration: null,
  });

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Register Service Worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration);
        
        setState(prev => ({ ...prev, swRegistration: registration }));

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
        setInstallPrompt(null);
        return true;
      } else {
        console.log('PWA installation dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, [installPrompt]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, notificationPermission: permission }));
      return permission;
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.swRegistration || !('PushManager' in window)) {
      return null;
    }

    try {
      const existingSubscription = await state.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // You'll need to generate VAPID keys and replace this
      const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY';
      
      const subscription = await state.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      console.log('Push subscription created:', subscription);
      
      // Send subscription to your server
      await sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [state.swRegistration]);

  // Show notification
  const showNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!state.swRegistration || state.notificationPermission !== 'granted') {
      return false;
    }

    try {
      await state.swRegistration.showNotification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Show notification failed:', error);
      return false;
    }
  }, [state.swRegistration, state.notificationPermission]);

  // Check if app is running in standalone mode (installed)
  const checkIfInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    setState(prev => ({ ...prev, isInstalled: isStandalone }));
    return isStandalone;
  }, []);

  // Handle offline status
  const handleOnlineStatus = useCallback(() => {
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
  }, []);

  // Background sync
  const requestBackgroundSync = useCallback(async (tag: string) => {
    if (!state.swRegistration || !('sync' in state.swRegistration)) {
      return false;
    }

    try {
      await state.swRegistration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }, [state.swRegistration]);

  // Update PWA
  const updatePWA = useCallback(async () => {
    if (!state.swRegistration) return false;

    try {
      await state.swRegistration.update();
      return true;
    } catch (error) {
      console.error('PWA update failed:', error);
      return false;
    }
  }, [state.swRegistration]);

  // Setup event listeners
  useEffect(() => {
    // Install prompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Online/offline events
    const handleOnline = () => handleOnlineStatus();
    const handleOffline = () => handleOnlineStatus();

    // App installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleOnlineStatus]);

  // Initialize PWA features
  useEffect(() => {
    registerServiceWorker();
    checkIfInstalled();
    
    if ('Notification' in window) {
      setState(prev => ({ 
        ...prev, 
        notificationPermission: Notification.permission 
      }));
    }
  }, [registerServiceWorker, checkIfInstalled]);

  return {
    ...state,
    installPWA,
    requestNotificationPermission,
    subscribeToPush,
    showNotification,
    requestBackgroundSync,
    updatePWA,
    checkIfInstalled,
  };
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    // Replace with your actual server endpoint
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
  }
}