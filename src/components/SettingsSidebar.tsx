
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { notificationService } from '../services/notificationService';
import FeedbackModal from './FeedbackModal';

interface SettingsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsSidebar = ({ open, onOpenChange }: SettingsSidebarProps) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();

  const { enableNotifications, testNotification } = useNotifications(notificationsEnabled);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      const granted = await enableNotifications();
      if (granted) {
        const success = await updateNotificationSetting(true);
        if (success) {
          notificationService.setEnabled(true);
          toast({
            title: "Notifications enabled",
            description: "We'll gently remind you when items are ready for review.",
          });
        }
      } else {
        toast({
          title: "Permission denied",
          description: "Please allow notifications in your browser settings to receive reminders.",
        });
      }
    } else {
      const success = await updateNotificationSetting(false);
      if (success) {
        notificationService.setEnabled(false);
        toast({
          title: "Notifications disabled",
          description: "You won't receive review reminders anymore.",
        });
      }
    }
  };

  const handleTestNotification = () => {
    testNotification();
    toast({
      title: "Test notification sent",
      description: "If notifications are working, you should see a test notification now.",
    });
  };

  const handleFeedbackClick = () => {
    setShowFeedbackModal(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black dark:text-[#F9F5EB]">Settings & Info</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* About Pocket Pause */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">About Pocket Pause</h3>
              <div className="space-y-2">
                <Link 
                  to="/about"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors block"
                >
                  <span className="text-black dark:text-[#F9F5EB]">About Pocket Pause</span>
                </Link>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Feedback</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleFeedbackClick}
                  className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors"
                >
                  <span className="text-black dark:text-[#F9F5EB]">Share Feedback</span>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Help us improve Pocket Pause</p>
                </button>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Legal</h3>
              <div className="space-y-2">
                <Link 
                  to="/privacy-policy"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-left p-3 rounded-lg bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors block"
                >
                  <span className="text-black dark:text-[#F9F5EB]">Privacy Policy</span>
                </Link>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Appearance</h3>
              <div className="bg-white/60 dark:bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-black dark:text-[#F9F5EB] font-medium">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Switch between light and dark themes</p>
                  </div>
                  <Switch 
                    checked={isDarkMode} 
                    onCheckedChange={toggleTheme}
                    className="ml-4"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">Pause Notifications</h3>
              <div className="bg-white/60 dark:bg-white/10 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-black dark:text-[#F9F5EB] font-medium">Gentle Reminders</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">We'll remind you when an item's ready for a thoughtful decision — no pressure.</p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled} 
                    onCheckedChange={handleNotificationToggle}
                    disabled={loading}
                    className="ml-4"
                  />
                </div>
                
                {notificationsEnabled && (
                  <Button
                    onClick={handleTestNotification}
                    variant="outline"
                    size="sm"
                    className="w-full bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border-gray-300 dark:border-gray-600 text-black dark:text-[#F9F5EB]"
                  >
                    Test Notification
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FeedbackModal 
        open={showFeedbackModal} 
        onOpenChange={setShowFeedbackModal} 
      />
    </>
  );
};

export default SettingsSidebar;
