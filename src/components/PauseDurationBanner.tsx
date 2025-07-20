
import { Timer } from 'lucide-react';
import { format, parse } from 'date-fns';

interface PauseDurationBannerProps {
  checkInTime: string;
}

const PauseDurationBanner = ({ checkInTime }: PauseDurationBannerProps) => {
  // Extract and format the date from checkInTime
  const extractAndFormatDate = (timeString: string) => {
    try {
      // Try to extract date from the string and calculate check-in date
      // The timeString is usually like "Checking-in in 19 hours" or similar
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      
      // For now, just use tomorrow as the check-in date
      // In a real app, you'd parse the actual check-in date from the data
      return format(tomorrow, 'MMM dd');
    } catch (error) {
      console.warn('Failed to format date:', timeString);
      return 'Soon';
    }
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
      {checkInTime} ({extractAndFormatDate(checkInTime)})
    </div>
  );
};

export default PauseDurationBanner;
