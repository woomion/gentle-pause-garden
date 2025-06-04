
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
        Your pause patterns
      </h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-black dark:text-[#F9F5EB] font-medium">
            You've paused {stats.weeklyPauses} {stats.weeklyPauses === 1 ? 'time' : 'times'} this week
          </p>
          <p className="text-black dark:text-[#F9F5EB] font-medium">
            {stats.monthlyPauses} {stats.monthlyPauses === 1 ? 'time' : 'times'} this month
          </p>
        </div>

        {stats.totalAmount > 0 && (
          <div className="space-y-3">
            <p className="text-black dark:text-[#F9F5EB] font-medium">
              In total, you've let go of {formatCurrency(stats.totalAmount)}
            </p>
            {stats.weeklyAmount > 0 && (
              <p className="text-black dark:text-[#F9F5EB]">
                {formatCurrency(stats.weeklyAmount)} this week
              </p>
            )}
            {stats.monthlyAmount > 0 && (
              <p className="text-black dark:text-[#F9F5EB]">
                {formatCurrency(stats.monthlyAmount)} this month
              </p>
            )}
          </div>
        )}

        {stats.totalPauses > 0 && (
          <div className="space-y-3">
            <p className="text-black dark:text-[#F9F5EB]">
              Most of your pauses happen when you feel:{' '}
              <Badge 
                className="rounded-full px-3 py-1 text-black font-medium ml-1"
                style={{ backgroundColor: '#CAB6F7' }}
              >
                {stats.topEmotion}
              </Badge>
              {' '}(that's helpful to notice!)
            </p>
          </div>
        )}

        <div className="pt-6 text-center">
          <p className="text-black dark:text-[#F9F5EB] font-medium text-base leading-relaxed">
            {stats.totalPauses > 0 
              ? "You're noticing. You're pausing. You're choosing."
              : "Start pausing items to see your mindful choices grow!"
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
