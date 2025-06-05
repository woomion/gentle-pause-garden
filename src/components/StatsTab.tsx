
import { Badge } from '@/components/ui/badge';

interface StatsData {
  totalPauses: number;
  weeklyPauses: number;
  monthlyPauses: number;
  totalAmount: number;
  weeklyAmount: number;
  monthlyAmount: number;
  topEmotion: string;
}

interface StatsTabProps {
  stats: StatsData;
}

const StatsTab = ({ stats }: StatsTabProps) => {
  return (
    <div className="space-y-8">
      <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
        Your pause patterns
      </h3>
      
      <div className="text-center py-12">
        <p className="text-black dark:text-[#F9F5EB] font-medium text-lg">
          Coming soon
        </p>
      </div>
    </div>
  );
};

export default StatsTab;
