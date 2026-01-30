export const notificationService = {
  // Check if browser supports notifications
  isSupported: () => {
    return 'Notification' in window;
  },

  // Request permission from user
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  // Get current permission state
  getPermissionState: () => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Send a notification
  send: (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/vite.svg', // Fallback icon or app logo
        badge: '/vite.svg',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
};