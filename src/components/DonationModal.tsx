
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DonationModal = ({ open, onOpenChange }: DonationModalProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const presetAmounts = [
    { value: 100, label: '$1' },
    { value: 300, label: '$3' },
    { value: 500, label: '$5' },
    { value: 1000, label: '$10' },
  ];

  const handleDonate = async () => {
    let amount = selectedAmount;
    
    if (amount === null && customAmount) {
      const customAmountNum = parseFloat(customAmount);
      if (isNaN(customAmountNum) || customAmountNum < 1) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount of at least $1",
          variant: "destructive"
        });
        return;
      }
      amount = Math.round(customAmountNum * 100); // Convert to cents
    }

    if (!amount || amount < 100) {
      toast({
        title: "Please select an amount",
        description: "Choose a preset amount or enter a custom amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-donation', {
        body: { amount }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null); // Clear preset selection
  };

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(''); // Clear custom amount
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 rounded-lg bg-card dark:bg-card border border-gray-200 dark:border-border">
        <DialogHeader className="text-center space-y-4 pt-2">
          <DialogTitle className="text-lg font-medium text-black dark:text-foreground">
            Support Pocket Pause
          </DialogTitle>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>
              Pocket Pause is built independently — one screen, one decision, one moment at a time.
            </p>
            <p>
              It's ad-free and runs on time, care, and coffee. Your support helps keep it simple, useful, and growing.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedAmount === preset.value ? "default" : "outline"}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`${
                    selectedAmount === preset.value 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground'
                  } hover:bg-primary/90 transition-colors`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black dark:text-foreground">
                Custom Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="25.00"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className="pl-7 bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground"
                />
              </div>
            </div>

            <Button
              onClick={handleDonate}
              disabled={loading || (!selectedAmount && !customAmount)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Donate with Stripe'}
            </Button>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
