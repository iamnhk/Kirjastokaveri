import type { FinnaBook } from './finnaApi';

export interface BookNotification {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl?: string;
  type: 'bookAvailable' | 'holdReady' | 'dueSoon' | 'availability' | 'hold_ready' | 'due_soon';
  message: string;
  isRead: boolean;
  timestamp: string;
  createdAt?: Date;
  expiresAt?: Date;
  metadata?: {
    library?: string;
    available?: number;
    previousAvailable?: number;
    daysRemaining?: number;
  };
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  bookAvailable: boolean; // New unified name
  holdReady: boolean; // New unified name
  dueSoon: boolean; // New unified name
  // Legacy support
  availabilityAlerts?: boolean;
  holdReadyAlerts?: boolean;
  dueSoonAlerts?: boolean;
}

// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Check current notification permission
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Show a browser notification
export const showBrowserNotification = (title: string, options?: NotificationOptions): void => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Simulate checking for book availability changes
// In a real app, this would be done by a backend service
export const checkBookAvailability = async (bookId: string): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // Randomly return true/false for demo purposes
      resolve(Math.random() > 0.7);
    }, 1000);
  });
};

// Create a notification for a book becoming available
export const createAvailabilityNotification = (book: FinnaBook): BookNotification => {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bookId: book.id,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookImageUrl: book.imageUrl,
    type: 'availability',
    message: `"${book.title}" is now available at your local library!`,
    isRead: false,
    createdAt: new Date(),
  };
};

// Create a notification for a hold being ready
export const createHoldReadyNotification = (book: FinnaBook): BookNotification => {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bookId: book.id,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookImageUrl: book.imageUrl,
    type: 'hold_ready',
    message: `Your hold for "${book.title}" is ready for pickup!`,
    isRead: false,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
};

// Create a notification for a book due soon
export const createDueSoonNotification = (book: FinnaBook, daysRemaining: number): BookNotification => {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    bookId: book.id,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookImageUrl: book.imageUrl,
    type: 'due_soon',
    message: `"${book.title}" is due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}!`,
    isRead: false,
    createdAt: new Date(),
  };
};

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  emailNotifications: false,
  pushNotifications: false,
  bookAvailable: true,
  holdReady: true,
  dueSoon: true,
};