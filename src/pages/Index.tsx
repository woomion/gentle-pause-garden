
import { useState, useEffect } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import AddPauseButton from '../components/AddPauseButton';
import InStoreModeButton from '../components/InStoreModeButton';
import PausedSection from '../components/PausedSection';
import PauseLogSection from '../components/PauseLogSection';
import GreaterJoyFundCTA from '../components/GreaterJoyFundCTA';
import FooterLinks from '../components/FooterLinks';
import SupportCTA from '../components/SupportCTA';
import PauseForm from '../components/PauseForm';
import WelcomeModal from '../components/WelcomeModal';
import SignupModal from '../components/SignupModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalDismissed, setSignupModalDismissed] = useState(false);
  const [userName, setUserName] = useState('');

  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Check if this is the user's first visit or get user's name
  useEffect(() => {
    console.log('Index useEffect triggered - User:', !!user, 'Auth loading:', authLoading);
    
    if (user && !authLoading) {
      // Get user's first name from user metadata or profile
      const firstName = user.user_metadata?.first_name || '';
      setUserName(firstName);
      
      // Check if user needs welcome flow
      const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
      if (!hasCompletedWelcome && !firstName) {
        setShowWelcomeModal(true);
      }
    }
  }, [user, authLoading]);

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    if (user) {
      localStorage.setItem(`hasCompletedWelcome_${user.id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const handleAddPause = () => {
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleShowSignup = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!user && !signupModalDismissed) {
      setShowSignupModal(true);
    }
  };

  const handleCloseSignup = () => {
    setShowSignupModal(false);
    setSignupModalDismissed(true);
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    console.log('Showing auth loading screen');
    return (
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] flex items-center justify-center">
        <div className="text-black dark:text-[#F9F5EB]">Loading...</div>
      </div>
    );
  }

  console.log('Rendering main Index content');

  return (
    <>
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto px-6 py-8">
          <PauseHeader />
          <WelcomeMessage firstName={userName} />
          <AddPauseButton onAddPause={handleAddPause} />
          <InStoreModeButton />
          <PausedSection />
          <GreaterJoyFundCTA />
          <PauseLogSection />
          <SupportCTA />
          <FooterLinks />
        </div>
      </div>
      
      {showForm && (
        <PauseForm 
          onClose={handleCloseForm} 
          onShowSignup={handleShowSignup}
          signupModalDismissed={signupModalDismissed}
        />
      )}
      
      {user && (
        <WelcomeModal 
          open={showWelcomeModal} 
          onComplete={handleWelcomeComplete} 
        />
      )}
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={handleCloseSignup} 
      />
    </>
  );
};

export default Index;
