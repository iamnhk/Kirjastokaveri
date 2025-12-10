/**
 * AvailabilityMonitor Component
 * Invisible component that monitors wishlist books for availability changes
 * Runs in the background and triggers notifications when books become available
 */

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAvailabilityMonitor } from '../../hooks/useAvailabilityMonitor';

export function AvailabilityMonitor() {
  const { isAuthenticated } = useAuth();

  // Enable monitoring only when user is authenticated
  // Check every 1 minute for demo purposes
  const { checkNow } = useAvailabilityMonitor({
    enabled: isAuthenticated,
    checkInterval: 1 * 60 * 1000, // 1 minute
  });

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        checkNow();
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isAuthenticated, checkNow]);

  return null;
}
