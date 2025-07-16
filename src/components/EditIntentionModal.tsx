
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditIntentionModalProps {
  intention: string;
  onSave: (newIntention: string) => void;
  onClose: () => void;
}

const EditIntentionModal = ({ intention, onSave, onClose }: EditIntentionModalProps) => {
  const [newIntention, setNewIntention] = useState(intention);

  const handleSave = () => {
    onSave(newIntention);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-cream dark:bg-background border-gray-200 dark:border-border max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-foreground">
            Edit Your Intention
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="intention" className="text-black dark:text-foreground">
              What are you reaching for?
            </Label>
            <Input
              id="intention"
              value={newIntention}
              onChange={(e) => setNewIntention(e.target.value)}
              className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20"
              placeholder="Enter your guiding intention..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground hover:bg-white/80 dark:hover:bg-muted/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditIntentionModal;
