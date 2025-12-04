import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import type {
  BookNotification,
  NotificationPreferences,
} from '../services/notificationService';
import {
  defaultNotificationPreferences,
  getNotificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from '../services/notificationService';
import { notificationsApi, tokenService } from '../services/apiClient';
import type { Notification as BackendNotification } from '../services/apiClient';

interface NotificationContextType {
  notifications: BookNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  notificationPermission: NotificationPermission;
  isLoading: boolean;
  addNotification: (notification: BookNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  requestPermission: () => Promise<NotificationPermission>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Map backend notification type to frontend type
function mapNotificationType(type: string): BookNotification['type'] {
  switch (type) {
    case 'BOOK_AVAILABLE':
      return 'bookAvailable';
    case 'READY_FOR_PICKUP':
      return 'holdReady';
    case 'DUE_DATE_REMINDER':
    case 'PICKUP_DEADLINE_APPROACHING':
      return 'dueSoon';
    default:
      return 'availability';
  }
}

// Convert backend notification to frontend format
function mapBackendNotification(n: BackendNotification): BookNotification {
  return {
    id: String(n.id),
    bookId: n.finna_id || '',
    bookTitle: n.book_title || n.title,
    bookAuthor: '', // Backend doesn't store author in notification
    bookImageUrl: undefined,
    type: mapNotificationType(n.notification_type),
    message: n.message,
    isRead: n.read,
    timestamp: n.created_at,
    createdAt: new Date(n.created_at),
    metadata: {
      library: n.library_name || undefined,
    },
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<BookNotification[]>(() => {
    const stored = localStorage.getItem('kirjastokaveri_notifications');
    return stored ? JSON.parse(stored) : [];
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    const stored = localStorage.getItem('kirjastokaveri_notification_preferences');
    return stored ? JSON.parse(stored) : defaultNotificationPreferences;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!tokenService.hasTokens()) return;
    
    try {
      setIsLoading(true);
      const backendNotifications = await notificationsApi.getAll();
      const mappedNotifications = backendNotifications.map(mapBackendNotification);
      
      // Merge with any local-only notifications (for offline support)
      const backendIds = new Set(mappedNotifications.map(n => n.id));
      const localOnly = notifications.filter(n => !backendIds.has(n.id) && !n.id.match(/^\d+$/));
      
      setNotifications([...mappedNotifications, ...localOnly]);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch when authenticated
  useEffect(() => {
    if (tokenService.hasTokens()) {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Poll for new notifications every 60 seconds when authenticated
  useEffect(() => {
    if (!tokenService.hasTokens()) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, 60000); // Poll every 60 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchNotifications]);

  // Save notifications to localStorage whenever they change (for offline access)
  useEffect(() => {
    localStorage.setItem('kirjastokaveri_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kirjastokaveri_notification_preferences', JSON.stringify(preferences));
  }, [preferences]);

  const addNotification = useCallback((notification: BookNotification) => {
    setNotifications(prev => [notification, ...prev]);

    // Show browser notification if enabled
    if (preferences.pushNotifications && notificationPermission === 'granted') {
      showBrowserNotification(notification.message, {
        body: `${notification.bookTitle} by ${notification.bookAuthor}`,
        icon: notification.bookImageUrl || '/icon-192.png',
        tag: notification.bookId,
      });
    }
  }, [preferences.pushNotifications, notificationPermission]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    // Sync to backend if it's a backend notification (numeric ID)
    if (tokenService.hasTokens() && /^\d+$/.test(notificationId)) {
      try {
        await notificationsApi.markAsRead(parseInt(notificationId, 10));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Revert on error
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: false } : n))
        );
      }
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    // Sync to backend
    if (tokenService.hasTokens()) {
      try {
        await notificationsApi.markAllAsRead();
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        // Refetch to restore correct state
        fetchNotifications();
      }
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications(prev => {
      const deletedNotification = prev.find(n => n.id === notificationId);
      // Store in closure for potential revert
      (async () => {
        if (tokenService.hasTokens() && /^\d+$/.test(notificationId)) {
          try {
            await notificationsApi.delete(parseInt(notificationId, 10));
          } catch (error) {
            console.error('Failed to delete notification:', error);
            // Revert on error
            if (deletedNotification) {
              setNotifications(p => [deletedNotification, ...p]);
            }
          }
        }
      })();
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  const clearAll = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => {
      const previousNotifications = [...prev];
      // Clear from backend (read notifications only by default)
      if (tokenService.hasTokens()) {
        (async () => {
          try {
            await notificationsApi.markAllAsRead();
          } catch (error) {
            console.error('Failed to clear notifications:', error);
            setNotifications(previousNotifications);
          }
        })();
      }
      return [];
    });
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    preferences,
    notificationPermission,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    requestPermission,
    refreshNotifications,
  }), [
    notifications,
    unreadCount,
    preferences,
    notificationPermission,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updatePreferences,
    requestPermission,
    refreshNotifications,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
