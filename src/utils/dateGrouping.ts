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
  // Helper function to parse dates that might be in old format (without year)
  const parseItemDate = (dateString: string): Date => {
    const parsed = new Date(dateString);
    // If the year is before 2020, it's likely an old format without year
    if (parsed.getFullYear() < 2020) {
      // Assume current year for old format dates
      const currentYear = new Date().getFullYear();
      const withCurrentYear = `${dateString}, ${currentYear}`;
      return new Date(withCurrentYear);
    }
    return parsed;
  };

  // Sort all items by date (newest first)
  const sortedItems = [...items].sort((a, b) => 
    parseItemDate(b.letGoDate).getTime() - parseItemDate(a.letGoDate).getTime()
  );
  
  // Group items by time periods
  const recentItems: PauseLogItem[] = [];
  const historicalItems: PauseLogItem[] = [];
  
  let recentItemsHeader = 'Recent';
  
  if (sortedItems.length > 0) {
    const mostRecentDate = parseItemDate(sortedItems[0].letGoDate);
    
    // Determine the cutoff and header based on the most recent item
    if (isThisWeek(mostRecentDate)) {
      recentItemsHeader = 'This week';
      sortedItems.forEach(item => {
        const itemDate = parseItemDate(item.letGoDate);
        if (isThisWeek(itemDate)) {
          recentItems.push(item);
        } else {
          historicalItems.push(item);
        }
      });
    } else if (isThisMonth(mostRecentDate)) {
      recentItemsHeader = format(mostRecentDate, 'MMMM');
      sortedItems.forEach(item => {
        const itemDate = parseItemDate(item.letGoDate);
        if (isThisMonth(itemDate)) {
          recentItems.push(item);
        } else {
          historicalItems.push(item);
        }
      });
    } else {
      // For items not in current week or month, group by the most recent month
      recentItemsHeader = format(mostRecentDate, 'MMMM yyyy');
      const mostRecentMonth = mostRecentDate.getMonth();
      const mostRecentYear = mostRecentDate.getFullYear();
      
      sortedItems.forEach(item => {
        const itemDate = parseItemDate(item.letGoDate);
        if (itemDate.getMonth() === mostRecentMonth && itemDate.getFullYear() === mostRecentYear) {
          recentItems.push(item);
        } else {
          historicalItems.push(item);
        }
      });
    }
  }
  
  // Group historical items by year and month
  const yearGroups: { [year: string]: { [monthKey: string]: PauseLogItem[] } } = {};
  
  historicalItems.forEach(item => {
    const date = parseItemDate(item.letGoDate);
    const year = date.getFullYear().toString();
    const monthKey = format(date, 'yyyy-MM');
    
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
            parseItemDate(b.letGoDate).getTime() - parseItemDate(a.letGoDate).getTime()
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