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
  
  // Group items by time periods
  const recentItems: PauseLogItem[] = [];
  const historicalItems: PauseLogItem[] = [];
  
  let recentItemsHeader = 'Recent';
  
  if (sortedItems.length > 0) {
    const mostRecentDate = new Date(sortedItems[0].letGoDate);
    
    // Determine the cutoff and header based on the most recent item
    let cutoffDate: Date;
    if (isThisWeek(mostRecentDate)) {
      recentItemsHeader = 'This week';
      // All items from this week go to recent
      cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else if (isThisMonth(mostRecentDate)) {
      recentItemsHeader = format(mostRecentDate, 'MMMM');
      // All items from this month go to recent
      cutoffDate = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
    } else {
      recentItemsHeader = format(mostRecentDate, 'MMMM yyyy');
      // All items from the most recent item's month go to recent
      cutoffDate = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
    }
    
    // Separate items based on the cutoff
    sortedItems.forEach(item => {
      const itemDate = new Date(item.letGoDate);
      if (recentItemsHeader === 'This week' && isThisWeek(itemDate)) {
        recentItems.push(item);
      } else if (recentItemsHeader !== 'This week' && itemDate >= cutoffDate) {
        recentItems.push(item);
      } else {
        historicalItems.push(item);
      }
    });
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