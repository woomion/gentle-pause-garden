
import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import FooterLinks from './FooterLinks';

interface PauseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const emotions = [
  { label: 'bored', color: '#F6E3D5' },
  { label: 'overwhelmed', color: '#E9E2F7' },
  { label: 'burnt out', color: '#FBF3C2' },
  { label: 'sad', color: '#DCE7F5' },
  { label: 'inspired', color: '#FBE7E6' },
  { label: 'deserving', color: '#E7D8F3' },
  { label: 'curious', color: '#DDEEDF' },
  { label: 'anxious', color: '#EDEAE5' },
  { label: 'lonely', color: '#CED8E3' },
  { label: 'celebratory', color: '#FAEED6' },
  { label: 'resentful', color: '#EAC9C3' },
  { label: 'something else', color: '#F0F0EC' }
];

const PauseForm = ({ isOpen, onClose }: PauseFormProps) => {
  const [formData, setFormData] = useState({
    link: '',
    itemName: '',
    storeName: '',
    price: '',
    photo: '',
    emotion: '',
    notes: '',
    pauseDuration: '24 hours'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-cream">
      <div className="max-w-md mx-auto px-6 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative mb-8">
          <div className="text-center">
            <div className="text-black font-medium text-lg tracking-wide mb-2">
              POCKET || PAUSE
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-0 p-2 text-black hover:text-taupe transition-colors"
          >
            <X size={24} />
          </button>
        </header>

        {/* Form Content */}
        <div className="flex-1">
          <h2 className="text-xl text-black mb-6 font-normal">Add Something to Pause</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-black text-sm mb-2">Link (paste a product URL)</label>
              <Input
                type="url"
                placeholder="www.example.com/item"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Item Name</label>
              <Input
                placeholder="What are you thinking of buying?"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Store Name</label>
              <Input
                placeholder="Where is this item from?"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Price</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Photo (optional)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0]?.name || '' })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lavender file:text-dark-gray hover:file:bg-lavender/80"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">How are you feeling right now?</label>
              <Select value={formData.emotion} onValueChange={(value) => setFormData({ ...formData, emotion: value })}>
                <SelectTrigger className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <SelectValue placeholder="Select emotion" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl">
                  {emotions.map((emotion) => (
                    <SelectItem key={emotion.label} value={emotion.label}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: emotion.color }}
                        />
                        <span className="capitalize">{emotion.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Notes (optional)</label>
              <Textarea
                placeholder="Why do you want this item?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-black text-sm mb-2">Pause for</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pauseDuration: '24 hours' })}
                  className={`py-2 px-4 rounded-xl border ${
                    formData.pauseDuration === '24 hours' 
                      ? 'bg-lavender border-lavender text-dark-gray' 
                      : 'bg-white border-gray-200 text-black'
                  }`}
                >
                  24 hours
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pauseDuration: '3 days' })}
                  className={`py-2 px-4 rounded-xl border ${
                    formData.pauseDuration === '3 days' 
                      ? 'bg-lavender border-lavender text-dark-gray' 
                      : 'bg-white border-gray-200 text-black'
                  }`}
                >
                  3 days
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pauseDuration: '1 week' })}
                  className={`py-2 px-4 rounded-xl border ${
                    formData.pauseDuration === '1 week' 
                      ? 'bg-lavender border-lavender text-dark-gray' 
                      : 'bg-white border-gray-200 text-black'
                  }`}
                >
                  1 week
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pauseDuration: 'A Season (3 months)' })}
                className={`w-full py-2 px-4 rounded-xl border ${
                  formData.pauseDuration === 'A Season (3 months)' 
                    ? 'bg-lavender border-lavender text-dark-gray' 
                    : 'bg-white border-gray-200 text-black'
                }`}
              >
                A Season (3 months)
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white border-gray-200 text-black hover:bg-gray-50 rounded-xl py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-lavender hover:bg-lavender/90 text-dark-gray rounded-xl py-3"
              >
                Start Pause
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <FooterLinks />
      </div>
    </div>
  );
};

export default PauseForm;
