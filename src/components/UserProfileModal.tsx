
import { useState } from 'react';
import { X, Timer, ChevronRight, ChevronDown, Settings, Palette, Bell, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserSettings } from '@/hooks/useUserSettings';
import { notificationService } from '@/services/notificationService';
import AccountModal from './AccountModal';
import AppPreferencesModal from './AppPreferencesModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [appPreferencesOpen, setAppPreferencesOpen] = useState(false);
  const navigate = useNavigate();
  
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();
  const { testNotification } = useNotifications(notificationsEnabled);

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

  const handleFeedbackClick = () => {
    setFeedbackOpen(!feedbackOpen);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        description: "We'd love to hear what you think!",
      });
      return;
    }

    setIsSubmittingFeedback(true);
    
    // Simulate submission (in a real app, this would send to a backend)
    setTimeout(() => {
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate you taking the time to help us improve Pocket Pause.",
      });
      setFeedback('');
      setIsSubmittingFeedback(false);
      setFeedbackOpen(false);
    }, 1000);
  };

  const handleSettingsClick = () => {
    setSettingsExpanded(!settingsExpanded);
  };


  const handleDecisionLogClick = () => {
    navigate('/pause-log');
    onClose();
  };

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!('Notification' in window)) {
        toast({
          title: "Not supported",
          description: "Your browser doesn't support notifications.",
          variant: "destructive"
        });
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          notificationService.setEnabled(true);
          const success = await updateNotificationSetting(true);
          if (success) {
            toast({
              title: "Notifications enabled",
              description: "We'll gently remind you when items are ready for review.",
            });
          }
        } else {
          toast({
            title: "Permission denied",
            description: "Please enable notifications in your browser settings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Permission error",
          description: "There was an error requesting notification permission.",
          variant: "destructive"
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
    if (Notification.permission === 'granted') {
      notificationService.setEnabled(true);
    }
    testNotification();
    toast({
      title: "Test notification sent",
      description: "If notifications are working, you should see a test notification now.",
    });
  };


  if (!isOpen || !user) return null;

  const firstName = user.user_metadata?.first_name || '';
  const email = user.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-start justify-center px-6 pt-16">
      <div className="bg-card rounded-2xl max-w-sm w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-foreground hover:text-muted-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {firstName && (
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {firstName}
            </h2>
          )}
          
          <p className="text-muted-foreground text-sm mb-6">
            {email}
          </p>
          
          <div className="space-y-4">
            {/* Settings Section */}
            <div className="border-t border-border pt-4">
              <div 
                onClick={handleSettingsClick}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded p-2 -m-2"
              >
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Settings
                  </span>
                </div>
                {settingsExpanded ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </div>
              
              {/* Expanded Settings Options */}
              {settingsExpanded && (
                <div className="mt-2 ml-6 space-y-1">
                  <div 
                    onClick={() => {
                      setAppPreferencesOpen(true);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/20 transition-colors rounded p-2 -m-1"
                  >
                    <Palette size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">App Preferences</span>
                  </div>
                  <div 
                    onClick={() => {
                      setAccountOpen(true);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/20 transition-colors rounded p-2 -m-1"
                  >
                    <User size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">Account</span>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between p-2 -m-2">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Notifications
                  </span>
                </div>
                <Switch 
                  checked={notificationsEnabled} 
                  onCheckedChange={handleNotificationToggle}
                  disabled={loading}
                />
              </div>
              
              {notificationsEnabled && (
                <div className="mt-2 ml-6">
                  <p className="text-xs text-muted-foreground mb-2">
                    Gentle review reminders
                  </p>
                  <Button
                    onClick={handleTestNotification}
                    variant="outline"
                    size="sm"
                    className="text-xs py-1 px-2 h-6"
                  >
                    Test Notification
                  </Button>
                </div>
              )}
            </div>

            {/* Decision Log Section */}
            <div className="border-t border-border pt-4">
              <div 
                onClick={handleDecisionLogClick}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded p-2 -m-2"
              >
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Decision Log
                  </span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </div>


            {/* Feedback and Sign Out Section */}
            <div className="border-t border-border pt-4">
              <div 
                onClick={handleFeedbackClick}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded p-2 -m-2 mb-3"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Send Feedback
                  </span>
                </div>
                {feedbackOpen ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </div>
              
              {/* Expanded Feedback Form */}
              {feedbackOpen && (
                <form onSubmit={handleSubmitFeedback} className="space-y-4 mb-4">
                  <div>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your thoughts, suggestions, or report any issues..."
                      className="mt-2 min-h-[120px]"
                      disabled={isSubmittingFeedback}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFeedbackOpen(false)}
                      className="flex-1"
                      disabled={isSubmittingFeedback}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmittingFeedback}
                    >
                      {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                    </Button>
                  </div>
                </form>
              )}
              
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="w-full rounded-xl py-3"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

          </div>
        </div>
      </div>
      
      <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
      <AppPreferencesModal isOpen={appPreferencesOpen} onClose={() => setAppPreferencesOpen(false)} />
    </div>
  );
};

export default UserProfileModal;
