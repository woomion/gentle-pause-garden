
import { Timer } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface PauseDurationBannerProps {
  checkInTime: string;
  pausedAt?: string;
  isReadyForReview?: boolean;
}

const PauseDurationBanner = ({ checkInTime, pausedAt, isReadyForReview }: PauseDurationBannerProps) => {
  // Calculate elapsed time since pausing
  const getElapsedTime = () => {
    if (!pausedAt) return null;
    
    try {
      const pausedDate = new Date(pausedAt);
      return formatDistanceToNow(pausedDate, { addSuffix: true });
    } catch (error) {
      console.warn('Failed to calculate elapsed time:', pausedAt);
      return null;
    }
  };

  // Extract and format the date from checkInTime
  const extractAndFormatDate = (timeString: string) => {
    try {
      const now = new Date();
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
        targetDate.setDate(now.getDate() + 1);
      }
      
      return format(targetDate, 'MMM dd');
    } catch (error) {
      console.warn('Failed to format date:', timeString);
      return 'Soon';
    }
  };

  const elapsedTime = getElapsedTime();

  return (
    <div 
      className="py-2 px-4 rounded-b-lg text-center text-xs font-medium flex items-center justify-center gap-2"
      style={{ 
        backgroundColor: '#eeeaf8',
        color: '#000'
      }}
    >
      <Timer size={14} />
      {isReadyForReview && elapsedTime ? (
        `Paused ${elapsedTime}`
      ) : (
        `${checkInTime} (${extractAndFormatDate(checkInTime)})`
      )}
    </div>
  );
};

export default PauseDurationBanner;
