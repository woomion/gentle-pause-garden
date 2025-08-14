import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';

interface ValuesSetupProps {
  onComplete: () => void;
  existingValues?: string[];
}

const CORE_VALUES = [
  { 
    id: 'sustainability', 
    label: 'Sustainability', 
    description: 'Choosing eco-friendly and ethically made products'
  },
  { 
    id: 'quality_over_quantity', 
    label: 'Quality over Quantity', 
    description: 'Investing in well-made items that last longer'
  },
  { 
    id: 'financial_freedom', 
    label: 'Financial Freedom', 
    description: 'Making purchases that support long-term financial goals'
  },
  { 
    id: 'minimalism', 
    label: 'Minimalism', 
    description: 'Keeping only what adds value to your life'
  },
  { 
    id: 'mindfulness', 
    label: 'Mindfulness', 
    description: 'Being present and intentional with spending decisions'
  },
  { 
    id: 'experiences_over_things', 
    label: 'Experiences over Things', 
    description: 'Prioritizing memories and experiences over material goods'
  },
  { 
    id: 'supporting_local', 
    label: 'Supporting Local', 
    description: 'Choosing local businesses and artisans when possible'
  }
];

export const ValuesSetup: React.FC<ValuesSetupProps> = ({ onComplete, existingValues = [] }) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(existingValues);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleValue = (valueId: string) => {
    setSelectedValues(prev => 
      prev.includes(valueId) 
        ? prev.filter(id => id !== valueId)
        : [...prev, valueId]
    );
  };

  const saveValues = async () => {
    if (!user) return;
    
    if (selectedValues.length === 0) {
      toast({
        title: "Please select at least one value",
        description: "Choose the values that matter most to you when making purchases.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          values_selected: selectedValues,
          values_setup_completed: true
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Values saved successfully!",
        description: `You've selected ${selectedValues.length} core values to guide your decisions.`
      });

      onComplete();
    } catch (error) {
      console.error('Error saving values:', error);
      toast({
        title: "Error saving values",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          What Matters Most to You?
        </CardTitle>
        <CardDescription className="text-base">
          Choose the values that should guide your purchasing decisions. These will help you make more intentional choices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3">
          {CORE_VALUES.map((value) => {
            const isSelected = selectedValues.includes(value.id);
            
            return (
              <div
                key={value.id}
                onClick={() => toggleValue(value.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{value.label}</h3>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedValues.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected values:</p>
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((valueId) => {
                const value = CORE_VALUES.find(v => v.id === valueId);
                return (
                  <Badge key={valueId} variant="secondary" className="text-xs">
                    {value?.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={saveValues} 
            disabled={isLoading || selectedValues.length === 0}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : existingValues.length > 0 ? 'Update Values' : 'Save Values'}
          </Button>
          {existingValues.length > 0 && (
            <Button variant="outline" onClick={onComplete}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};