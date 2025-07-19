
import { useState } from 'react';
import { X, Bell, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import FeedbackModal from './FeedbackModal';
import PartnerManagement from './PartnerManagement';
import TagManagement from './TagManagement';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { notificationsEnabled, updateNotificationSetting } = useUserSettings();
  const { toast } = useToast();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    try {
      if (checked) {
        // Request browser permission for web notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            toast({
              title: "Notifications blocked",
              description: "Please enable notifications in your browser settings to receive updates.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      const success = await updateNotificationSetting(checked);
      
      if (success) {
        toast({
          title: checked ? "Notifications enabled" : "Notifications disabled",
          description: checked 
            ? "You'll receive notifications about your paused items." 
            : "You won't receive any notifications.",
        });
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotification = () => {
    if (!notificationsEnabled) {
      toast({
        title: "Notifications disabled",
        description: "Please enable notifications first.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission !== 'granted') {
      toast({
        title: "Notifications not allowed",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
      return;
    }

    new Notification('Test Notification', {
      body: 'Your notifications are working correctly!',
      icon: '/favicon.ico'
    });

    toast({
      title: "Test notification sent",
      description: "Check if you received the notification.",
    });
  };

  const handleFeedbackClick = () => {
    setFeedbackOpen(true);
  };

  if (!isOpen || !user) return null;

  const firstName = user.user_metadata?.first_name || '';
  const email = user.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl max-w-sm w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-lavender text-dark-gray text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {firstName && (
            <h2 className="text-lg font-semibold text-black dark:text-[#F9F5EB] mb-1">
              {firstName}
            </h2>
          )}
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            {email}
          </p>

          <div className="space-y-4">
            {/* Notifications Section */}
            <div className="border-t border-gray-200 dark:border-white/20 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-black dark:text-[#F9F5EB]">
                    Notifications
                  </span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              
              {notificationsEnabled && (
                <Button
                  onClick={handleTestNotification}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20"
                >
                  Test Notification
                </Button>
              )}
            </div>

            {/* Partner Management Section */}
            <PartnerManagement onClose={onClose} />

            {/* Tag Management Section */}
            <TagManagement onClose={onClose} />

            {/* Feedback Section */}
            <div className="border-t border-gray-200 dark:border-white/20 pt-4">
              <Button
                onClick={handleFeedbackClick}
                variant="outline"
                className="w-full bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20 rounded-xl py-3"
              >
                <MessageSquare size={16} className="mr-2" />
                Send Feedback
              </Button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-200 dark:border-white/20 pt-4">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="w-full bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20 rounded-xl py-3"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};

export default UserProfileModal;
