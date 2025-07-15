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
    } else {
      // For guests, use a general flag
      localStorage.setItem('hasCompletedWelcome_guest', 'true');
    }
  };

  const shouldShowWelcomeModal = (showWelcomeModal: boolean): boolean => {
    if (authLoading) return false;
    
    if (user) {
      // For authenticated users - show if they haven't completed welcome
      const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
      return showWelcomeModal && !hasCompletedWelcome;
    } else {
      // For guests - show if they haven't completed welcome
      const hasCompletedWelcome = localStorage.getItem('hasCompletedWelcome_guest');
      return showWelcomeModal && !hasCompletedWelcome;
    }
  };

  const shouldShowNameStep = (): boolean => {
    // Only show name step if user is authenticated and doesn't have a name
    if (!user) return false; // Guests don't need to provide name
    const firstName = user.user_metadata?.first_name || '';
    return !firstName;
  };

  return {
    userName,
    handleWelcomeComplete,
    shouldShowWelcomeModal,
    shouldShowNameStep,
  };
};