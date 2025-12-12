import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePauseLog } from '../hooks/usePauseLog';
import { useSupabasePauseLog } from '../hooks/useSupabasePauseLog';
import { usePausedItems } from '../hooks/usePausedItems';
import FooterLinks from '../components/FooterLinks';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const Clarity = () => {
  const { user } = useAuth();
  
  // Get decided items from pause log
  const localPauseLog = usePauseLog();
  const supabasePauseLog = useSupabasePauseLog();
  const { items: decidedItems } = user ? supabasePauseLog : localPauseLog;
  
  // Get currently paused items (excluding items ready for review)
  const { items: allPausedItems, getItemsForReview } = usePausedItems();
  
  // Filter out items that are ready for review - they're not "still pausing"
  const stillPausingItems = useMemo(() => {
    const now = new Date();
    return allPausedItems.filter(item => {
      const checkInDate = item.checkInDate instanceof Date ? item.checkInDate : new Date(item.checkInDate);
      return checkInDate > now;
    });
  }, [allPausedItems]);

  // Calculate clarity metrics
  const metrics = useMemo(() => {
    const purchased = decidedItems.filter(item => item.status === 'purchased');
    const letGo = decidedItems.filter(item => item.status === 'let-go');
    const stillPausing = stillPausingItems.length;
    
    const totalDecisions = purchased.length + letGo.length;
    
    // Calculate total value of items (using originalPausedItem.price if available)
    const purchasedValue = purchased.reduce((sum, item) => {
      const price = item.originalPausedItem?.price || 0;
      return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
    }, 0);
    
    const letGoValue = letGo.reduce((sum, item) => {
      const price = item.originalPausedItem?.price || 0;
      return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
    }, 0);
    
    const totalPausedValue = stillPausingItems.reduce((sum, item) => {
      const price = (item as any).price || 0;
      return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
    }, 0);

    // Calculate average pause time before deciding (in days)
    const pauseDurations = decidedItems
      .filter(item => item.originalPausedItem?.pausedAt)
      .map(item => {
        const pausedAt = new Date(item.originalPausedItem.pausedAt);
        const decidedAt = new Date(item.letGoDate);
        return Math.ceil((decidedAt.getTime() - pausedAt.getTime()) / (1000 * 60 * 60 * 24));
      })
      .filter(days => days > 0 && days < 365); // Filter out invalid values
    
    const avgPauseTime = pauseDurations.length > 0
      ? Math.round(pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length)
      : 0;

    return {
      purchased: purchased.length,
      letGo: letGo.length,
      stillPausing,
      totalDecisions,
      purchasedValue,
      letGoValue,
      totalPausedValue,
      avgPauseTime,
    };
  }, [decidedItems, stillPausingItems]);

  const totalItems = metrics.purchased + metrics.letGo + metrics.stillPausing;
  const purchasedPercent = totalItems > 0 ? (metrics.purchased / totalItems) * 100 : 0;
  const letGoPercent = totalItems > 0 ? (metrics.letGo / totalItems) * 100 : 0;
  const pausingPercent = totalItems > 0 ? (metrics.stillPausing / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-cream transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link 
            to="/" 
            className="p-2 -ml-2 rounded-full hover:bg-lavender/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-dark-gray" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-black">Clarity Dashboard</h1>
            <p className="text-sm text-gray-600">Your intentional decisions</p>
          </div>
        </div>

        {/* Empty State */}
        {totalItems === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lavender/20 flex items-center justify-center">
              <TrendingUp size={28} className="text-lavender" />
            </div>
            <h2 className="text-lg font-medium text-black mb-2">No decisions yet</h2>
            <p className="text-sm text-gray-600 mb-6">
              Start pausing items to see your clarity metrics grow.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-lavender text-white rounded-full text-sm font-medium hover:bg-lavender/90 transition-colors"
            >
              Pause your first item
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Stat */}
            <Card className="bg-gradient-to-br from-lavender/20 to-sage/20 border-lavender/30">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-black mb-1">
                  {metrics.totalDecisions + metrics.stillPausing}
                </p>
                <p className="text-sm text-gray-600">
                  intentional moments
                </p>
              </CardContent>
            </Card>

            {/* Decision Breakdown */}
            <Card className="border-lavender/20">
              <CardContent className="p-5">
                <h2 className="text-sm font-medium text-gray-600 mb-4">Decision Breakdown</h2>
                
                <div className="space-y-4">
                  {/* Bought with intention */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-sage" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-black">Bought with intention</span>
                        <span className="text-sm text-gray-600">{metrics.purchased}</span>
                      </div>
                      <Progress value={purchasedPercent} className="h-2 bg-gray-100" />
                    </div>
                  </div>

                  {/* Let go */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose/20 flex items-center justify-center flex-shrink-0">
                      <XCircle size={16} className="text-rose" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-black">Let go</span>
                        <span className="text-sm text-gray-600">{metrics.letGo}</span>
                      </div>
                      <Progress value={letGoPercent} className="h-2 bg-gray-100" />
                    </div>
                  </div>

                  {/* Still pausing */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-lavender/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-lavender" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-black">Still pausing</span>
                        <span className="text-sm text-gray-600">{metrics.stillPausing}</span>
                      </div>
                      <Progress value={pausingPercent} className="h-2 bg-gray-100" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Stats */}
            {(metrics.purchasedValue > 0 || metrics.letGoValue > 0 || metrics.totalPausedValue > 0) && (
              <Card className="border-lavender/20">
                <CardContent className="p-5">
                  <h2 className="text-sm font-medium text-gray-600 mb-4">Value Breakdown</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {metrics.purchasedValue > 0 && (
                      <div className="text-center p-3 bg-sage/10 rounded-xl">
                        <p className="text-xl font-semibold text-black">
                          ${metrics.purchasedValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">bought intentionally</p>
                      </div>
                    )}
                    {metrics.letGoValue > 0 && (
                      <div className="text-center p-3 bg-rose/10 rounded-xl">
                        <p className="text-xl font-semibold text-black">
                          ${metrics.letGoValue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">released</p>
                      </div>
                    )}
                  </div>
                  
                  {metrics.totalPausedValue > 0 && (
                    <div className="mt-4 text-center p-3 bg-lavender/10 rounded-xl">
                      <p className="text-xl font-semibold text-black">
                        ${metrics.totalPausedValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">currently paused</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reflection Time */}
            {metrics.avgPauseTime > 0 && (
              <Card className="border-lavender/20">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-black mb-1">
                    {metrics.avgPauseTime} days
                  </p>
                  <p className="text-sm text-gray-600">
                    average reflection time before deciding
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Encouragement */}
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 italic">
                Every pause is a moment of clarity.
              </p>
            </div>
          </div>
        )}

        <FooterLinks />
      </div>
    </div>
  );
};

export default Clarity;
