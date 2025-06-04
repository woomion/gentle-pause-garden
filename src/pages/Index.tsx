
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
import { useNotifications } from '../hooks/useNotifications';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Check if this is the user's first visit
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const hasVisited = localStorage.getItem('hasVisited');
    
    if (savedName) {
      setUserName(savedName);
    }
    
    if (!hasVisited) {
      setShowWelcomeModal(true);
    }
  }, []);

  // Listen for changes to notification settings
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(saved ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    localStorage.setItem('userName', name);
    localStorage.setItem('hasVisited', 'true');
    setShowWelcomeModal(false);
  };

  const handleAddPause = () => {
    console.log('Add pause button clicked - form will open after animation');
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650); // Slightly longer than the 600ms ripple animation
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  return (
    <>
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
        <div className="max-w-md mx-auto px-6 py-8">
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
      
      {showForm && <PauseForm onClose={handleCloseForm} />}
      
      <WelcomeModal 
        open={showWelcomeModal} 
        onComplete={handleWelcomeComplete} 
      />
    </>
  );
};

export default Index;
