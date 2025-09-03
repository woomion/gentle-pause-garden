
import { Database } from '@/integrations/supabase/types';

export type DbPausedItem = Database['public']['Tables']['paused_items']['Row'];
export type DbPausedItemInsert = Database['public']['Tables']['paused_items']['Insert'];

export const extractStoreName = (url: string): string => {
  console.log('🔧 extractStoreName called with URL:', url);
  
  if (!url) {
    console.log('🔧 extractStoreName: No URL provided, returning empty string');
    return '';
  }
  
  try {
    const hostname = new URL(url).hostname;
    const result = hostname.replace('www.', '').split('.')[0];
    console.log('🔧 extractStoreName: hostname:', hostname, 'result:', result);
    
    // If the result is the Supabase project ID, return empty string instead
    if (result === 'cnjznmbgxprsrovmdywe') {
      console.log('🔧 extractStoreName: Detected Supabase project ID, returning empty string');
      return '';
    }
    
    return result;
  } catch {
    console.log('🔧 extractStoreName: Error parsing URL, returning empty string');
    return '';
  }
};

export const parseDurationToDays = (duration: string): number => {
  const durationMap: Record<string, number> = {
    '24 hours': 1,
    '3 days': 3,
    '1 week': 7,
    '2 weeks': 14,
    '1 month': 30,
    '3 months': 90
  };

  return durationMap[duration.toLowerCase()] || 1;
};

export const calculateCheckInTimeDisplay = (checkInDate: Date): string => {
  const now = new Date();
  const diffMs = checkInDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 0) return 'Ready to review';
  if (diffMinutes < 60) return `Reviewing in ${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`;
  if (diffHours < 24) return `Reviewing in ${diffHours}hr${diffHours === 1 ? '' : 's'}`;
  if (diffDays === 1) return 'Reviewing in 1 day';
  
  return `Reviewing in ${diffDays} days`;
};

// Legacy functions for backward compatibility with pause log converters
export const extractStoreNameFromNotes = (notes: string | null): string => {
  if (!notes) return '';
  
  if (notes.includes('STORE:')) {
    const storeMatch = notes.match(/STORE:([^|]*)/);
    if (storeMatch) {
      return storeMatch[1].trim();
    }
  }
  
  return '';
};

export const extractActualNotes = (notes: string | null): string | undefined => {
  if (!notes) return undefined;
  
  let actualNotes = notes;
  
  if (actualNotes.includes('STORE:')) {
    actualNotes = actualNotes.replace(/STORE:[^|]*\|?/, '').trim();
  }
  
  if (actualNotes.includes('LINK:')) {
    actualNotes = actualNotes.replace(/LINK:[^|]*\|?/, '').trim();
  }
  
  return actualNotes === '' ? undefined : actualNotes;
};

export const formatNotesWithStore = (storeName: string, notes?: string): string | null => {
  let notesWithStore = '';
  
  if (storeName && storeName.trim()) {
    notesWithStore = `STORE:${storeName}`;
    if (notes && notes.trim()) {
      notesWithStore += `|${notes}`;
    }
  } else if (notes && notes.trim()) {
    notesWithStore = notes;
  }
  
  return notesWithStore || null;
};
