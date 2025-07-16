
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackModal = ({ open, onOpenChange }: FeedbackModalProps) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast({
        title: "Please enter your feedback",
        description: "We'd love to hear what you think!",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission (in a real app, this would send to a backend)
    setTimeout(() => {
      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate you taking the time to help us improve Pocket Pause.",
      });
      setFeedback('');
      setIsSubmitting(false);
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-background border-gray-200 dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-black dark:text-foreground">
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="feedback" className="text-black dark:text-foreground">
              What would you like to tell us about Pocket Pause?
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts, suggestions, or report any issues..."
              className="mt-2 min-h-[120px] bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground hover:bg-white/80 dark:hover:bg-muted/80"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
