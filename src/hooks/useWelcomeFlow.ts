import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useWelcomeFlow = () => {
  const [userName, setUserName] = useState('');
  const { user, loading: authLoading } = useAuth();

  // Check if this is the user's first visit or get user's name
  useEffect(() => {
    console.log('Welcome flow useEffect triggered - User:', !!user, 'Auth loading:', authLoading);
    
    if (user && !authLoading) {
      // Get user's first name from user metadata or profile
      const firstName = user.user_metadata?.first_name || '';
      setUserName(firstName);
    }
  }, [user, authLoading]);

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    if (user) {
      localStorage.setItem(`hasCompletedWelcome_${user.id}`, 'true');
    }
  };

  const shouldShowWelcomeModal = (showWelcomeModal: boolean): boolean => {
    if (!user || authLoading) return false;
    
    const firstName = user.user_metadata?.first_name || '';
    const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
    
    return showWelcomeModal && !hasCompletedWelcome && !firstName;
  };

  return {
    userName,
    handleWelcomeComplete,
    shouldShowWelcomeModal,
  };
};