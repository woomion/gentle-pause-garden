
import { useState } from 'react';
import { Settings, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SettingsSidebar from './SettingsSidebar';
import UserProfileModal from './UserProfileModal';
import SignupModal from './SignupModal';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';

const PauseHeader = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user } = useAuth();
  const { partners } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();

  const firstName = user?.user_metadata?.first_name || '';
  const email = user?.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  const handleAccountClick = () => {
    if (user) {
      setProfileOpen(true);
    } else {
      setSignupOpen(true);
    }
  };

  return (
    <>
      <header className="relative mb-18">
        <div className="text-center">
          <Link to="/" className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2 hover:text-gray-600 transition-colors inline-block">
            POCKET || PAUSE
          </Link>
        </div>
        
        <div className="absolute top-6 right-0 flex items-center gap-2">
          {user && hasPausePartnerAccess && partners.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Users size={12} className="text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {partners.length}
              </span>
            </div>
          )}
          
          <button 
            className="p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
            onClick={handleAccountClick}
          >
            {user ? (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-lavender text-dark-gray text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User size={24} />
            )}
          </button>
          
          <button 
            className="p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={24} />
          </button>
        </div>
      </header>
      
      <SettingsSidebar open={settingsOpen} onOpenChange={setSettingsOpen} />
      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
};

export default PauseHeader;
