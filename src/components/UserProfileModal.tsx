
import { useState } from 'react';
import { X, Timer, MessageSquare, ChevronRight, ChevronDown, Settings, Palette, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';

import SettingsModal from './SettingsModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

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
    setFeedbackOpen(true);
  };

  const handleSettingsClick = () => {
    setSettingsExpanded(!settingsExpanded);
  };


  const handleDecisionLogClick = () => {
    navigate('/pause-log');
    onClose();
  };


  if (!isOpen || !user) return null;

  const firstName = user.user_metadata?.first_name || '';
  const email = user.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center px-6 pt-16">
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
                      setSettingsOpen(true);
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/20 transition-colors rounded p-2 -m-1"
                  >
                    <Palette size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">App Preferences</span>
                  </div>
                  <div 
                    onClick={() => {
                      // Future: Add account settings modal
                      console.log('Account settings clicked - coming soon');
                    }}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/20 transition-colors rounded p-2 -m-1"
                  >
                    <User size={14} className="text-muted-foreground" />
                    <span className="text-sm text-foreground">Account</span>
                  </div>
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


            {/* Feedback Section */}
            <div className="border-t border-border pt-4">
              <Button
                onClick={handleFeedbackClick}
                variant="outline"
                className="w-full rounded-xl py-3"
              >
                <MessageSquare size={16} className="mr-2" />
                Send Feedback
              </Button>
            </div>

            {/* Sign Out */}
            <div className="pt-4">
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
      
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default UserProfileModal;
