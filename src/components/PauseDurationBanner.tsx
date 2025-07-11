
import { Timer } from 'lucide-react';

interface PauseDurationBannerProps {
  checkInTime: string;
}

const PauseDurationBanner = ({ checkInTime }: PauseDurationBannerProps) => {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 py-2 px-4 rounded-b-2xl text-center text-xs font-medium flex items-center justify-center gap-2"
      style={{ 
        backgroundColor: '#EDE9F3',
        color: '#000'
      }}
    >
      <Timer size={14} />
      {checkInTime}
    </div>
  );
};

export default PauseDurationBanner;
