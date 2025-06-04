
import { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import SettingsSidebar from './SettingsSidebar';
import UserProfileModal from './UserProfileModal';

const PauseHeader = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();

  const firstName = user?.user_metadata?.first_name || '';
  const email = user?.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  return (
    <>
      <header className="relative mb-18">
        <div className="text-center">
          <Link to="/" className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2 hover:text-gray-600 transition-colors inline-block">
            POCKET || PAUSE
          </Link>
        </div>
        
        <div className="absolute top-6 right-0 flex items-center gap-2">
          {user && (
            <button 
              className="p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
              onClick={() => setProfileOpen(true)}
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-lavender text-dark-gray text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
          
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
    </>
  );
};

export default PauseHeader;
