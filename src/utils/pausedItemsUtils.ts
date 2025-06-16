
import { Database } from '@/integrations/supabase/types';

export type DbPausedItem = Database['public']['Tables']['paused_items']['Row'];
export type DbPausedItemInsert = Database['public']['Tables']['paused_items']['Insert'];

export const extractStoreName = (url: string): string => {
  if (!url) return 'Unknown Store';
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown Store';
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
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours <= 0) return 'Ready to review';
  if (diffHours <= 24) return `Checking-in in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  if (diffDays === 1) return 'Checking-in in 1 day';
  
  return `Checking-in in ${diffDays} days`;
};

export const extractStoreNameFromNotes = (notes: string | null): string => {
  if (!notes) return 'Unknown Store';
  
  if (notes.includes('STORE:')) {
    const storeMatch = notes.match(/STORE:([^|]*)/);
    if (storeMatch) {
      return storeMatch[1].trim();
    }
  }
  
  return 'Unknown Store';
};

export const extractActualNotes = (notes: string | null): string | undefined => {
  if (!notes) return undefined;
  
  if (notes.includes('STORE:')) {
    const actualNotes = notes.replace(/STORE:[^|]*\|?/, '').trim();
    return actualNotes === '' ? undefined : actualNotes;
  }
  
  return notes;
};

export const formatNotesWithStore = (storeName: string, notes?: string): string | null => {
  let notesWithStore = '';
  
  if (storeName && storeName !== 'Unknown Store') {
    notesWithStore = `STORE:${storeName}`;
    if (notes && notes.trim()) {
      notesWithStore += `|${notes}`;
    }
  } else if (notes && notes.trim()) {
    notesWithStore = notes;
  }
  
  return notesWithStore || null;
};
