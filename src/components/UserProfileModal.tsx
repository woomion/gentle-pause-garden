
import { useState } from 'react';
import { X, Timer, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';
import DonationModal from './DonationModal';
import SettingsSection from './SettingsSection';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal = ({ isOpen, onClose }: UserProfileModalProps) => {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
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


  const handleDecisionLogClick = () => {
    navigate('/pause-log');
    onClose();
  };

  const handleSupportClick = () => {
    setDonationOpen(true);
  };

  if (!isOpen || !user) return null;

  const firstName = user.user_metadata?.first_name || '';
  const email = user.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
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
          
          <div className="space-y-6">
            {/* Settings Section */}
            <SettingsSection />

            {/* Decision Log Section */}
            <div className="border-t border-gray-200 dark:border-white/20 pt-4">
              <div 
                onClick={handleDecisionLogClick}
                className="flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded p-2 -m-2"
              >
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-medium text-black dark:text-[#F9F5EB]">
                    Decision Log
                  </span>
                </div>
                <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
            </div>


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
            <div className="pt-4">
              <Button
                onClick={handleSignOut}
                disabled={isSigningOut}
                variant="outline"
                className="w-full bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20 rounded-xl py-3"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

            {/* Support Section - moved to bottom */}
            <div className="pt-6 text-center">
              <button
                onClick={handleSupportClick}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors underline underline-offset-2 decoration-1"
              >
                Support the Pause
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <DonationModal open={donationOpen} onOpenChange={setDonationOpen} />
    </div>
  );
};

export default UserProfileModal;
