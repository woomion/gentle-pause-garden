
import { Timer } from 'lucide-react';
import { format, parse } from 'date-fns';

interface PauseDurationBannerProps {
  checkInTime: string;
}

const PauseDurationBanner = ({ checkInTime }: PauseDurationBannerProps) => {
  // Extract and format the date from checkInTime
  const extractAndFormatDate = (timeString: string) => {
    try {
      // Parse the check-in time string to get the actual date
      // The timeString is usually like "Checking-in in 19 hours" or similar
      const now = new Date();
      
      // Extract hours from the string
      const hoursMatch = timeString.match(/(\d+)\s*hours?/);
      const daysMatch = timeString.match(/(\d+)\s*days?/);
      
      let targetDate = new Date(now);
      
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        targetDate.setDate(now.getDate() + days);
      } else if (hoursMatch) {
        const hours = parseInt(hoursMatch[1], 10);
        targetDate.setHours(now.getHours() + hours);
      } else {
        // Default to tomorrow if we can't parse
        targetDate.setDate(now.getDate() + 1);
      }
      
      return format(targetDate, 'MMM dd');
    } catch (error) {
      console.warn('Failed to format date:', timeString);
      return 'Soon';
    }
  };

  return (
    <div 
      className="py-2 px-4 rounded-b-lg text-center text-xs font-medium flex items-center justify-center gap-2"
      style={{ 
        backgroundColor: '#eeeaf8',
        color: '#000'
      }}
    >
      <Timer size={14} />
      {checkInTime} ({extractAndFormatDate(checkInTime)})
    </div>
  );
};

export default PauseDurationBanner;
