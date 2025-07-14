
import { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SettingsSidebar from './SettingsSidebar';
import UserProfileModal from './UserProfileModal';
import SignupModal from './SignupModal';

const PauseHeader = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user } = useAuth();

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
            POCKET <span className="inline-block px-1 text-shadow-sm shadow-inner bg-black/5 dark:bg-white/5 rounded-sm border border-black/10 dark:border-white/10 text-black/70 dark:text-[#F9F5EB]/70">||</span> PAUSE
          </Link>
        </div>
        
        <div className="absolute top-6 right-0 flex items-center gap-2">
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
