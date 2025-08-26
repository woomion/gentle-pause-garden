import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Mail } from 'lucide-react';

export function EmailBatchingSettings() {
  const { emailBatchingEnabled, updateEmailBatchingSetting, loading } = useUserSettings();

  const handleEmailPreferenceChange = async (value: string) => {
    const shouldBatch = value === 'batch';
    await updateEmailBatchingSetting(shouldBatch);
  };

  if (loading) {
    return <div className="h-20 animate-pulse bg-muted rounded" />;
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Mail size={16} />
        Email Delivery
      </Label>
      <RadioGroup
        value={emailBatchingEnabled ? 'batch' : 'individual'}
        onValueChange={handleEmailPreferenceChange}
        className="space-y-4"
      >
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="batch" id="batch" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="batch" className="font-medium">Batch emails daily</Label>
            <p className="text-sm text-muted-foreground">
              One daily email with all items ready for review
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="individual" id="individual" className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor="individual" className="font-medium">Send email as each item becomes ready</Label>
            <p className="text-sm text-muted-foreground">
              Individual emails sent when items are ready for review
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}