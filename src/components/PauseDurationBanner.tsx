
import { Timer } from 'lucide-react';
import { format, parse } from 'date-fns';

interface PauseDurationBannerProps {
  checkInTime: string;
}

const PauseDurationBanner = ({ checkInTime }: PauseDurationBannerProps) => {
  // Format the date as (Mmm/DD)
  const formatCheckInDate = (dateString: string) => {
    try {
      // Try to parse the date string in various formats
      let date;
      if (dateString.includes('/')) {
        // Format like "12/25/2023" or "12/25"
        const parts = dateString.split('/');
        if (parts.length === 3) {
          date = parse(dateString, 'M/d/yyyy', new Date());
        } else if (parts.length === 2) {
          date = parse(`${dateString}/${new Date().getFullYear()}`, 'M/d/yyyy', new Date());
        }
      } else {
        // Try parsing as a standard date
        date = new Date(dateString);
      }
      
      if (date && !isNaN(date.getTime())) {
        return `(${format(date, 'MMM/dd')})`;
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateString);
    }
    
    // Fallback: try to extract date-like pattern from the string
    const dateMatch = dateString.match(/(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
    if (dateMatch) {
      return `(${dateMatch[1]})`;
    }
    
    return `(${dateString})`;
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 py-2 px-4 rounded-b-2xl text-center text-xs font-medium flex items-center justify-center gap-2"
      style={{ 
        backgroundColor: '#eeeaf8',
        color: '#000'
      }}
    >
      <Timer size={14} />
      {formatCheckInDate(checkInTime)}
    </div>
  );
};

export default PauseDurationBanner;
