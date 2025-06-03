
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface PauseFormProps {
  onClose: () => void;
}

const PauseForm = ({ onClose }: PauseFormProps) => {
  const [formData, setFormData] = useState({
    link: '',
    itemName: '',
    storeName: '',
    price: '',
    photo: null as File | null,
    emotion: '',
    notes: '',
    pauseDuration: '24hours'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Handle form submission
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, photo: file }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <SheetHeader className="text-center pb-6 flex-shrink-0">
        <div className="text-xs text-taupe mb-2">POCKET || PAUSE</div>
        <SheetTitle className="text-xl font-medium text-dark-gray">Add Something to Pause</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-1">
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm text-dark-gray font-medium">Link (paste a product URL)</Label>
            <Input
              id="link"
              type="url"
              placeholder="www.example.com/item"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              className="bg-cream border-gray-300 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-sm text-dark-gray font-medium">Item Name</Label>
            <Input
              id="itemName"
              placeholder="What are you thinking of buying?"
              value={formData.itemName}
              onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
              className="bg-cream border-gray-300 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName" className="text-sm text-dark-gray font-medium">Store Name</Label>
            <Input
              id="storeName"
              placeholder="Where is this item from?"
              value={formData.storeName}
              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
              className="bg-cream border-gray-300 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-dark-gray font-medium">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="bg-cream border-gray-300 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm text-dark-gray font-medium">Photo (optional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-cream border-gray-300 h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-lavender file:text-dark-gray"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emotion" className="text-sm text-dark-gray font-medium">How are you feeling right now?</Label>
            <Select value={formData.emotion} onValueChange={(value) => setFormData(prev => ({ ...prev, emotion: value }))}>
              <SelectTrigger className="bg-cream border-gray-300 h-12 text-base">
                <SelectValue placeholder="Select emotion" />
              </SelectTrigger>
              <SelectContent className="bg-cream">
                <SelectItem value="excited">Excited</SelectItem>
                <SelectItem value="anxious">Anxious</SelectItem>
                <SelectItem value="happy">Happy</SelectItem>
                <SelectItem value="stressed">Stressed</SelectItem>
                <SelectItem value="curious">Curious</SelectItem>
                <SelectItem value="impulsive">Impulsive</SelectItem>
                <SelectItem value="calm">Calm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm text-dark-gray font-medium">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Why do you want this item?"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="bg-cream border-gray-300 min-h-[100px] text-base resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-dark-gray font-medium">Pause for</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={formData.pauseDuration === '24hours' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, pauseDuration: '24hours' }))}
                className={`h-12 text-sm ${formData.pauseDuration === '24hours' ? 'bg-lavender text-dark-gray hover:bg-lavender/90' : 'border-gray-300 hover:bg-lavender/20'}`}
              >
                24 hours
              </Button>
              <Button
                type="button"
                variant={formData.pauseDuration === '3days' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, pauseDuration: '3days' }))}
                className={`h-12 text-sm ${formData.pauseDuration === '3days' ? 'bg-lavender text-dark-gray hover:bg-lavender/90' : 'border-gray-300 hover:bg-lavender/20'}`}
              >
                3 days
              </Button>
              <Button
                type="button"
                variant={formData.pauseDuration === '1week' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, pauseDuration: '1week' }))}
                className={`h-12 text-sm ${formData.pauseDuration === '1week' ? 'bg-lavender text-dark-gray hover:bg-lavender/90' : 'border-gray-300 hover:bg-lavender/20'}`}
              >
                1 week
              </Button>
            </div>
            <Button
              type="button"
              variant={formData.pauseDuration === 'season' ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, pauseDuration: 'season' }))}
              className={`w-full h-12 text-sm ${formData.pauseDuration === 'season' ? 'bg-lavender text-dark-gray hover:bg-lavender/90' : 'border-gray-300 hover:bg-lavender/20'}`}
            >
              A Season (3 months)
            </Button>
          </div>
        </form>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-12 border-gray-300 text-base"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          className="flex-1 h-12 bg-lavender text-dark-gray hover:bg-lavender/90 text-base font-medium"
        >
          Start Pause
        </Button>
      </div>
    </div>
  );
};

export default PauseForm;
