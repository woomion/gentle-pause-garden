import { format, isThisYear, isThisWeek, isThisMonth } from 'date-fns';
import { PauseLogItem } from '../stores/pauseLogStore';

export interface HierarchicalData {
  recentItems: PauseLogItem[]; // 7 most recent items
  recentItemsHeader: string; // "This week" or month name
  years: YearGroup[];
}

export interface YearGroup {
  year: string;
  months: MonthGroup[];
}

export interface MonthGroup {
  monthKey: string; // "2025-01" format for sorting
  monthLabel: string; // "January" for display
  items: PauseLogItem[];
}

export const createHierarchicalStructure = (items: PauseLogItem[]): HierarchicalData => {
  // Sort all items by date (newest first)
  const sortedItems = [...items].sort((a, b) => 
    new Date(b.letGoDate).getTime() - new Date(a.letGoDate).getTime()
  );
  
  // Take first 7 items as recent
  const recentItems = sortedItems.slice(0, 7);
  const historicalItems = sortedItems.slice(7);
  
  // Determine header for recent items
  let recentItemsHeader = 'Recent';
  if (recentItems.length > 0) {
    const mostRecentDate = new Date(recentItems[0].letGoDate);
    if (isThisWeek(mostRecentDate)) {
      recentItemsHeader = 'This week';
    } else if (isThisMonth(mostRecentDate)) {
      recentItemsHeader = format(mostRecentDate, 'MMMM');
    } else {
      recentItemsHeader = format(mostRecentDate, 'MMMM yyyy');
    }
  }
  
  // Group historical items by year and month
  const yearGroups: { [year: string]: { [monthKey: string]: PauseLogItem[] } } = {};
  
  historicalItems.forEach(item => {
    const date = new Date(item.letGoDate);
    const year = date.getFullYear().toString();
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMMM');
    
    if (!yearGroups[year]) {
      yearGroups[year] = {};
    }
    if (!yearGroups[year][monthKey]) {
      yearGroups[year][monthKey] = [];
    }
    yearGroups[year][monthKey].push(item);
  });
  
  // Convert to structured format
  const years: YearGroup[] = Object.entries(yearGroups)
    .map(([year, months]) => ({
      year,
      months: Object.entries(months)
        .map(([monthKey, items]) => ({
          monthKey,
          monthLabel: format(new Date(monthKey + '-01'), 'MMMM'),
          items: items.sort((a, b) => 
            new Date(b.letGoDate).getTime() - new Date(a.letGoDate).getTime()
          )
        }))
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey)) // Newest months first
    }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Newest years first
  
  return {
    recentItems,
    recentItemsHeader,
    years
  };
};