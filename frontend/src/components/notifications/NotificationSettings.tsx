import { ArrowLeft, BellRing, BookOpen, Clock, Mail, Package } from 'lucide-react';
import { useThemeTokens } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { theme, currentTheme } = useThemeTokens();
  const { preferences, updatePreferences, notificationPermission, requestPermission } = useNotifications();

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      updatePreferences({ pushNotifications: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className={`${currentTheme.text} text-xl`}>Notification Settings</h2>
          <p className={`text-sm ${currentTheme.textMuted}`}>Manage how you receive notifications</p>
        </div>
      </div>

      <Separator className={currentTheme.border} />

      <Card className={`p-4 ${theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-purple-100' : 'bg-purple-500/20'}`}>
            <BellRing className={`w-5 h-5 ${theme === 'light' ? 'text-purple-600' : 'text-purple-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="push-notifications" className={`${currentTheme.text} cursor-pointer`}>
                Push Notifications
              </Label>
              {notificationPermission === 'granted' ? (
                <Switch
                  id="push-notifications"
                  checked={preferences.pushNotifications}
                  onCheckedChange={() => handleToggle('pushNotifications')}
                />
              ) : (
                <Button
                  size="sm"
                  onClick={handleRequestPermission}
                  disabled={notificationPermission === 'denied'}
                  className={`${theme === 'light' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Enable
                </Button>
              )}
            </div>
            <p className={`text-sm ${currentTheme.textMuted}`}>
              Receive browser notifications for important updates
            </p>
            {notificationPermission === 'denied' && (
              <Badge variant="destructive" className="mt-2">
                Notifications blocked - enable in browser settings
              </Badge>
            )}
            {notificationPermission === 'default' && (
              <Badge variant="secondary" className="mt-2">
                Click "Enable" to allow notifications
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className={`${currentTheme.text}`}>Email Notifications</h3>
        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme.border} ${
            theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <Mail className={`w-5 h-5 ${currentTheme.textMuted}`} />
            <div>
              <Label htmlFor="email-notifications" className={`${currentTheme.text} cursor-pointer`}>
                Email Notifications
              </Label>
              <p className={`text-sm ${currentTheme.textMuted}`}>Receive updates via email</p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.emailNotifications}
            onCheckedChange={() => handleToggle('emailNotifications')}
          />
        </div>
      </div>

      <Separator className={currentTheme.border} />

      <div className="space-y-4">
        <h3 className={`${currentTheme.text}`}>Alert Types</h3>
        <p className={`text-sm ${currentTheme.textMuted}`}>
          Choose which events you want to be notified about
        </p>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme.border} ${
            theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <BookOpen className={`w-5 h-5 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`} />
            </div>
            <div>
              <Label htmlFor="availability-alerts" className={`${currentTheme.text} cursor-pointer`}>
                Book Availability
              </Label>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                When a book on your wishlist becomes available
              </p>
            </div>
          </div>
          <Switch
            id="availability-alerts"
            checked={preferences.availabilityAlerts}
            onCheckedChange={() => handleToggle('availabilityAlerts')}
          />
        </div>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme.border} ${
            theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-blue-100' : 'bg-blue-500/20'}`}>
              <Package className={`w-5 h-5 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
            </div>
            <div>
              <Label htmlFor="hold-ready-alerts" className={`${currentTheme.text} cursor-pointer`}>
                Hold Ready
              </Label>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                When your reserved book is ready for pickup
              </p>
            </div>
          </div>
          <Switch
            id="hold-ready-alerts"
            checked={preferences.holdReadyAlerts}
            onCheckedChange={() => handleToggle('holdReadyAlerts')}
          />
        </div>

        <div
          className={`flex items-center justify-between p-4 rounded-lg border ${currentTheme.border} ${
            theme === 'light' ? 'bg-white' : 'bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20'}`}>
              <Clock className={`w-5 h-5 ${theme === 'light' ? 'text-orange-600' : 'text-orange-400'}`} />
            </div>
            <div>
              <Label htmlFor="due-soon-alerts" className={`${currentTheme.text} cursor-pointer`}>
                Due Soon Reminders
              </Label>
              <p className={`text-sm ${currentTheme.textMuted}`}>
                Remind me when a book is due soon
              </p>
            </div>
          </div>
          <Switch
            id="due-soon-alerts"
            checked={preferences.dueSoonAlerts}
            onCheckedChange={() => handleToggle('dueSoonAlerts')}
          />
        </div>
      </div>
    </div>
  );
}
