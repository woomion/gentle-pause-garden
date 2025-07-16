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
  console.log('DEBUG: All items and their dates:', items.map(item => ({ 
    name: item.itemName, 
    originalDate: item.letGoDate,
    parsedDate: new Date(item.letGoDate),
    parsedMonth: new Date(item.letGoDate).getMonth() + 1,
    parsedYear: new Date(item.letGoDate).getFullYear()
  })));

  // Helper function to parse dates that might be in old format (without year)
  const parseItemDate = (dateString: string): Date => {
    // Handle old format dates like "Jun 15" or "May 20"
    const parts = dateString.trim().split(' ');
    if (parts.length >= 2) {
      const monthStr = parts[0];
      const dayStr = parts[1];
      
      // Direct month mapping - no ambiguity
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const monthNum = monthMap[monthStr];
      const dayNum = parseInt(dayStr, 10);
      
      if (monthNum !== undefined && !isNaN(dayNum)) {
        // Use current year, create date directly
        return new Date(2025, monthNum, dayNum);
      }
    }
    
    // For any other format, try normal parsing
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
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
    
    // Get month directly to avoid any formatting issues
    const month = date.getMonth(); // 0-based (0=Jan, 5=Jun)
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // Convert to 1-based for key
    
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
        .map(([monthKey, items]) => {
          // Extract month number from monthKey (e.g., "2025-06" -> 6)
          const monthNum = parseInt(monthKey.split('-')[1], 10);
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
          
          return {
            monthKey,
            monthLabel: monthNames[monthNum - 1], // Convert back to 0-based for array access
            items: items.sort((a, b) => 
              parseItemDate(b.letGoDate).getTime() - parseItemDate(a.letGoDate).getTime()
            )
          };
        })
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey)) // Newest months first
    }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Newest years first
  
  return {
    recentItems,
    recentItemsHeader,
    years
  };
};