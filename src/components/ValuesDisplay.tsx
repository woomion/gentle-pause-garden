import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';

interface ValuesDisplayProps {
  values: string[];
  className?: string;
}

const VALUE_LABELS: Record<string, string> = {
  'sustainability': 'Sustainability',
  'quality_over_quantity': 'Quality over Quantity',
  'financial_freedom': 'Financial Freedom',
  'minimalism': 'Minimalism',
  'mindfulness': 'Mindfulness',
  'experiences_over_things': 'Experiences over Things',
  'supporting_local': 'Supporting Local'
};

export const ValuesDisplay: React.FC<ValuesDisplayProps> = ({ values, className = '' }) => {
  if (!values || values.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Heart className="h-4 w-4" />
        <span>Your Values</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((valueId) => (
          <Badge 
            key={valueId} 
            variant="outline" 
            className="text-xs bg-primary/5 border-primary/20 text-primary"
          >
            {VALUE_LABELS[valueId] || valueId}
          </Badge>
        ))}
      </div>
    </div>
  );
};