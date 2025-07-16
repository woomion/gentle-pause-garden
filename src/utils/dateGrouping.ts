import { format, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { PauseLogItem } from '../stores/pauseLogStore';

export interface GroupedItems {
  groupTitle: string;
  items: PauseLogItem[];
}

export const groupItemsByDate = (items: PauseLogItem[]): GroupedItems[] => {
  const groups: { [key: string]: PauseLogItem[] } = {};
  
  items.forEach(item => {
    const date = new Date(item.letGoDate);
    let groupKey: string;
    
    if (isThisWeek(date)) {
      groupKey = 'This Week';
    } else {
      groupKey = format(date, 'MMMM'); // Just month name, no year
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });
  
  // Convert to array and sort groups by recency
  const groupedArray = Object.entries(groups).map(([groupTitle, items]) => ({
    groupTitle,
    items
  }));
  
  // Sort groups: "This Week" first, then by most recent month
  groupedArray.sort((a, b) => {
    if (a.groupTitle === 'This Week') return -1;
    if (b.groupTitle === 'This Week') return 1;
    
    // For months, sort by the most recent item in each group
    const aLatest = Math.max(...a.items.map(item => new Date(item.letGoDate).getTime()));
    const bLatest = Math.max(...b.items.map(item => new Date(item.letGoDate).getTime()));
    
    return bLatest - aLatest; // Most recent first
  });
  
  return groupedArray;
};