import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

interface Greeting {
  category: string;
  messages: string[];
}

const greetings: Greeting[] = [
  {
    category: 'morning',
    messages: [
      'A new day, a new pause.',
      'Let\'s greet the day with clarity.',
      'Before the day runs away, let\'s check in.',
      'Morning thoughts, softly gathered.',
      'What matters most this morning?'
    ]
  },
  {
    category: 'midday',
    messages: [
      'A moment to reflect, mid-journey.',
      'Let\'s pause before you press go.',
      'A quick breath before the next thing.',
      'What\'s still asking for your attention?',
      'A little clarity goes a long way.'
    ]
  },
  {
    category: 'evening',
    messages: [
      'Reflect gently before the day slips away.',
      'What can we pause before the evening sets in?',
      'A moment to choose, before you lose steam.',
      'Let\'s settle what\'s unsettled.'
    ]
  },
  {
    category: 'latenight',
    messages: [
      'Still here? Let\'s pause before the pull of tomorrow.',
      'Even now, you can choose slowly.',
      'The quiet hour is perfect for reflection.',
      'Let\'s tuck your intentions in too.',
      'What still needs your gentle attention?'
    ]
  },
  {
    category: 'newuser',
    messages: [
      'Welcome. Let\'s build your pause space.',
      'Ready to choose with more clarity?',
      'Your mindful space starts here.',
      'Let\'s add something to reflect on.',
      'Begin with one thoughtful pause.'
    ]
  },
  {
    category: 'returning',
    messages: [
      'Good to have you back.',
      'Let\'s pick up where you paused.',
      'Welcome back to your little pocket of clarity.',
      'Anything new asking for your attention?',
      'A gentle pause is always here for you.'
    ]
  }
];

const getTimeBasedCategory = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 21) return 'evening';
  return 'latenight';
};

const isNewUser = (user: User): boolean => {
  if (!user) return false;
  
  // Check if user has completed welcome flow
  const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
  if (!hasCompletedWelcome) return true;
  
  // Check if account is less than 24 hours old
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceCreation < 24;
};

const isReturningUser = (user: User): boolean => {
  if (!user) return false;
  
  // Check if user's last visit was more than 24 hours ago
  const lastVisit = localStorage.getItem(`lastVisit_${user.id}`);
  if (!lastVisit) return false;
  
  const lastVisitTime = new Date(lastVisit);
  const now = new Date();
  const hoursSinceLastVisit = (now.getTime() - lastVisitTime.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastVisit > 24;
};

const getRandomMessage = (category: string): string => {
  const greeting = greetings.find(g => g.category === category);
  if (!greeting) return 'Let\'s check in before you check out';
  
  const messages = greeting.messages;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};

const shouldUpdateGreeting = (userId: string): boolean => {
  const lastUpdate = localStorage.getItem(`greetingUpdate_${userId}`);
  if (!lastUpdate) return true;
  
  const lastUpdateTime = new Date(lastUpdate);
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceUpdate >= 3;
};

export const useDynamicGreeting = () => {
  const [greeting, setGreeting] = useState<string>('Let\'s check in before you check out');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setGreeting('Let\'s check in before you check out');
      return;
    }

    // Update last visit
    localStorage.setItem(`lastVisit_${user.id}`, new Date().toISOString());

    // Check if we should update the greeting
    if (!shouldUpdateGreeting(user.id)) {
      const cachedGreeting = localStorage.getItem(`cachedGreeting_${user.id}`);
      if (cachedGreeting) {
        setGreeting(cachedGreeting);
        return;
      }
    }

    // Determine greeting category
    let category: string;
    
    if (isNewUser(user)) {
      category = 'newuser';
    } else if (isReturningUser(user)) {
      category = 'returning';
    } else {
      category = getTimeBasedCategory();
    }

    const newGreeting = getRandomMessage(category);
    setGreeting(newGreeting);

    // Cache the greeting and update timestamp
    localStorage.setItem(`cachedGreeting_${user.id}`, newGreeting);
    localStorage.setItem(`greetingUpdate_${user.id}`, new Date().toISOString());

  }, [user]);

  return greeting;
};