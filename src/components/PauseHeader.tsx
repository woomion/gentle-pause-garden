
import { useState } from 'react';
import { User, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserProfileModal from './UserProfileModal';
import SignupModal from './SignupModal';
import { useInstalledApp } from '@/hooks/useInstalledApp';

interface PauseHeaderProps {
  onProfileModalChange?: (isOpen: boolean) => void;
}

const PauseHeader = ({ onProfileModalChange }: PauseHeaderProps = {}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const installed = useInstalledApp();
  const showCourses = false; // Temporarily hide Pocket Wisdom

  const firstName = user?.user_metadata?.first_name || '';
  const email = user?.email || '';
  const initials = firstName ? firstName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();

  const handleAccountClick = () => {
    if (user) {
      setProfileOpen(true);
      // Notify parent that profile modal is opening
      if (onProfileModalChange) {
        onProfileModalChange(true);
      }
    } else {
      setSignupOpen(true);
    }
  };

  const handleCourseClick = () => {
    if (location.pathname === '/courses') {
      navigate({ pathname: '/', search: location.search });
    } else {
      navigate({ pathname: '/courses', search: location.search });
    }
  };

  return (
    <>
      <header className="relative mb-8 sm:mb-12 max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className={`text-center md:text-left md:flex md:items-center md:justify-between ${installed ? 'pt-0 sm:pt-1' : 'pt-2 sm:pt-4'}`}>
          <Link
            to={{ pathname: '/', search: location.search }}
            className={`text-foreground font-medium text-lg tracking-wide ${installed ? 'mb-4 sm:mb-6 md:mb-0' : 'mb-6 sm:mb-8 md:mb-0'} hover:text-muted-foreground transition-colors inline-block`}
          >
            POCKET || PAUSE
          </Link>
          
          <div className="hidden md:flex items-center gap-3">
            {showCourses && (
              <button
                className="p-2 text-foreground hover:text-muted-foreground transition-colors flex items-center justify-center"
                onClick={handleCourseClick}
                title="Course section"
              >
                <BookOpen size={24} />
              </button>
            )}

            <button
              className="p-2 text-foreground hover:text-muted-foreground transition-colors flex items-center justify-center"
              onClick={handleAccountClick}
            >
              {user ? (
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User size={24} />
              )}
            </button>
          </div>
        </div>

        <div className={`absolute ${installed ? 'top-6 sm:top-8' : 'top-12 sm:top-16'} right-4 sm:right-6 flex md:hidden items-center justify-end gap-3`}>
          {showCourses && (
            <button
              className="p-2 text-foreground hover:text-muted-foreground transition-colors flex items-center justify-center"
              onClick={handleCourseClick}
              title="Course section"
            >
              <BookOpen size={24} />
            </button>
          )}

          <button
            className="p-2 text-foreground hover:text-muted-foreground transition-colors flex items-center justify-center"
            onClick={handleAccountClick}
          >
            {user ? (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User size={24} />
            )}
          </button>
        </div>
      </header>

      <UserProfileModal 
        isOpen={profileOpen} 
        onClose={() => {
          setProfileOpen(false);
          // Notify parent that profile modal is closing  
          if (onProfileModalChange) {
            onProfileModalChange(false);
          }
        }} 
      />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
};

export default PauseHeader;
