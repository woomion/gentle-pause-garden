
import { useState } from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserProfileModal from './UserProfileModal';
import SignupModal from './SignupModal';

const PauseHeader = () => {
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
            POCKET || PAUSE
          </Link>
        </div>
        
        <div className="absolute top-6 right-0">
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
        </div>
      </header>
      
      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
};

export default PauseHeader;
