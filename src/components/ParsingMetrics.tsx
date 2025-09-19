import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MetricsData {
  totalParses: number;
  cacheHits: number;
  avgParseTime: number;
  cacheHitRate: number;
  methodAverages: Array<{
    method: string;
    avgTime: number;
    count: number;
  }>;
}

export const ParsingMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const loadMetrics = async () => {
    try {
      const { getParseMetrics } = await import('@/utils/unifiedUrlParser');
      const data = getParseMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load parsing metrics:', error);
    }
  };

  const clearCache = async () => {
    try {
      const { clearParseCache } = await import('@/utils/unifiedUrlParser');
      clearParseCache();
      loadMetrics(); // Refresh metrics
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 opacity-70 hover:opacity-100"
      >
        📊 Parser Metrics
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Parser Performance</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      {metrics ? (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-muted-foreground">Total Parses</div>
              <div className="font-mono">{metrics.totalParses}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cache Hits</div>
              <div className="font-mono">{metrics.cacheHits}</div>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1">Cache Hit Rate</div>
            <Progress value={metrics.cacheHitRate * 100} className="h-2" />
            <div className="text-right font-mono">
              {(metrics.cacheHitRate * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1">Avg Parse Time</div>
            <div className="font-mono">{metrics.avgParseTime.toFixed(0)}ms</div>
          </div>

          <div>
            <div className="text-muted-foreground mb-2">Method Performance</div>
            <div className="space-y-1">
              {metrics.methodAverages.map((method) => (
                <div key={method.method} className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    {method.method}
                  </Badge>
                  <div className="text-right">
                    <div className="font-mono">{method.avgTime.toFixed(0)}ms</div>
                    <div className="text-muted-foreground">({method.count}x)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={loadMetrics}>
              🔄 Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={clearCache}>
              🗑️ Clear Cache
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-4">
          Loading metrics...
        </div>
      )}
    </Card>
  );
};