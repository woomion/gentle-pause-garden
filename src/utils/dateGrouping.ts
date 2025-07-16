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
    // Try parsing as-is first
    let parsed = new Date(dateString);
    
    // If the year is before 2020 or invalid, it's likely an old format without year
    if (parsed.getFullYear() < 2020 || isNaN(parsed.getTime())) {
      // For old format dates like "Jun 15", use a more direct approach
      const currentYear = new Date().getFullYear();
      
      // Split the date string and reconstruct it properly
      const parts = dateString.trim().split(' ');
      if (parts.length >= 2) {
        const month = parts[0]; // "Jun"
        const day = parts[1]; // "15"
        
        // Create date in format that JavaScript handles well: "June 15, 2025"
        const monthNames: { [key: string]: string } = {
          'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
          'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
          'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
        };
        
        const fullMonth = monthNames[month] || month;
        const properFormat = `${fullMonth} ${day}, ${currentYear}`;
        parsed = new Date(properFormat);
      }
      
      // If still invalid, fallback to current date
      if (isNaN(parsed.getTime())) {
        parsed = new Date();
      }
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