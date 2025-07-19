
import { useState } from 'react';
import { User, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import UserProfileModal from './UserProfileModal';
import SignupModal from './SignupModal';
import QuickPauseButton from './QuickPauseButton';

interface PauseHeaderProps {
  showIntroText?: boolean;
}

const PauseHeader = ({ showIntroText = false }: PauseHeaderProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleQuickPause = () => {
    // This would trigger the same pause form as the main button
    // For now, just log to console - you can integrate with your existing pause logic
    console.log('Quick pause in-store triggered');
  };

  const handleCourseClick = () => {
    if (location.pathname === '/courses') {
      navigate('/');
    } else {
      navigate('/courses');
    }
  };

  return (
    <>
      <header className="relative w-full">
        {/* Top section with centered POCKET || PAUSE */}
        <div className="text-center mb-4">
          <Link to="/" className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide hover:text-gray-600 transition-colors">
            POCKET || PAUSE
          </Link>
        </div>
        
        {/* Icons positioned below and to the right */}
        <div className="flex justify-end items-center mb-4">
          <div className="flex items-center gap-3">
          <button 
            className="p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors flex items-center justify-center"
            onClick={handleCourseClick}
            title="Course section"
          >
            <BookOpen size={24} />
          </button>
          
          <button 
            className="p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors flex items-center justify-center"
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
        </div>
        
        {/* Conditional intro text */}
        {showIntroText && (
          <div className="text-center w-full mb-8 pt-4 pb-4">
            <h1 className="text-black dark:text-[#F9F5EB] font-medium text-2xl tracking-wide">
              Hi Michelle — let's check in before you check out
            </h1>
          </div>
        )}
      </header>
      
      <UserProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
};

export default PauseHeader;
