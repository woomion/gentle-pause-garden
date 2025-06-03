import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PauseFormProps {
  onClose: () => void;
}

const emotions = [
  { name: 'bored', color: '#F6E3D5' },
  { name: 'overwhelmed', color: '#E9E2F7' },
  { name: 'burnt out', color: '#FBF3C2' },
  { name: 'sad', color: '#DCE7F5' },
  { name: 'inspired', color: '#FBE7E6' },
  { name: 'deserving', color: '#E7D8F3' },
  { name: 'curious', color: '#DDEEDF' },
  { name: 'anxious', color: '#EDEAE5' },
  { name: 'lonely', color: '#CED8E3' },
  { name: 'celebratory', color: '#FAEED6' },
  { name: 'resentful', color: '#EAC9C3' },
  { name: 'something else', color: '#F0F0EC' }
];

const otherPauseLengths = [
  '2 weeks',
  '1 month',
  '3 months'
];

const PauseForm = ({ onClose }: PauseFormProps) => {
  const [formData, setFormData] = useState({
    link: '',
    itemName: '',
    storeName: '',
    price: '',
    photo: null as File | null,
    emotion: '',
    notes: '',
    duration: '',
    otherDuration: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, photo: file }));
  };

  const handleDurationSelect = (duration: string) => {
    setFormData(prev => ({ 
      ...prev, 
      duration: duration,
      otherDuration: '' // Clear dropdown selection
    }));
  };

  const handleOtherDurationSelect = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      otherDuration: value,
      duration: '' // Clear button selection
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Show ripple effect for 1 second
    setTimeout(() => {
      console.log('Pause item data:', formData);
      // TODO: Save to database/collection
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-cream z-50 overflow-y-auto">
      <div className="min-h-screen px-6 py-8">
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

        {/* Form */}
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-dark-gray text-center mb-8">
            Add Something to Pause
          </h1>

          <div className="space-y-4">
            {/* Link Field */}
            <div className="space-y-1">
              <Label htmlFor="link" className="text-dark-gray font-medium text-base">
                Link (paste a product URL)
              </Label>
              <Input
                id="link"
                type="url"
                placeholder="www.example.com/item"
                value={formData.link}
                onChange={(e) => handleInputChange('link', e.target.value)}
                className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7]"
              />
            </div>

            {/* Item Name Field */}
            <div className="space-y-1">
              <Label htmlFor="itemName" className="text-dark-gray font-medium text-base">
                Item Name
              </Label>
              <Input
                id="itemName"
                type="text"
                placeholder="What are you thinking of buying?"
                value={formData.itemName}
                onChange={(e) => handleInputChange('itemName', e.target.value)}
                className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7]"
              />
            </div>

            {/* Store Name Field */}
            <div className="space-y-1">
              <Label htmlFor="storeName" className="text-dark-gray font-medium text-base">
                Store Name
              </Label>
              <Input
                id="storeName"
                type="text"
                placeholder="Where is this item from?"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7]"
              />
            </div>

            {/* Price Field */}
            <div className="space-y-1">
              <Label htmlFor="price" className="text-dark-gray font-medium text-base">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="bg-white border-gray-200 rounded-xl py-3 px-4 placeholder:text-[#B0ABB7]"
              />
            </div>

            {/* Photo Upload Field */}
            <div className="space-y-1">
              <Label htmlFor="photo" className="text-dark-gray font-medium text-base">
                Photo (optional)
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-white border-gray-200 rounded-xl h-12 flex items-center file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-lavender file:text-dark-gray hover:file:bg-lavender/80 [&::file-selector-button]:mr-3 [&::file-selector-button]:py-2 [&::file-selector-button]:px-3 [&::file-selector-button]:rounded-lg [&::file-selector-button]:border-0 [&::file-selector-button]:text-sm [&::file-selector-button]:font-medium [&::file-selector-button]:bg-lavender [&::file-selector-button]:text-dark-gray hover:[&::file-selector-button]:bg-lavender/80"
                style={{ 
                  color: '#B0ABB7',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center',
                  height: '48px'
                }}
              />
            </div>

            {/* Emotion Selection */}
            <div className="space-y-1">
              <Label className="text-dark-gray font-medium text-base">
                How are you feeling right now?
              </Label>
              <Select value={formData.emotion} onValueChange={(value) => handleInputChange('emotion', value)}>
                <SelectTrigger className="bg-white border-gray-200 rounded-xl py-3 px-4">
                  <SelectValue placeholder="Select emotion" className="placeholder:text-[#B0ABB7]" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 rounded-xl max-h-60 overflow-y-auto">
                  {emotions.map((emotion) => (
                    <SelectItem key={emotion.name} value={emotion.name} className="rounded-lg my-1">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: emotion.color }}
                        />
                        <span className="capitalize">{emotion.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes Field */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-dark-gray font-medium text-base">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Why do you want this item?"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-white border-gray-200 rounded-xl py-3 px-4 min-h-[80px] resize-none placeholder:text-[#B0ABB7] text-base"
              />
            </div>

            {/* Pause Duration */}
            <div className="space-y-2">
              <Label className="text-dark-gray font-medium text-base">
                Pause for
              </Label>
              
              {/* Row of three buttons */}
              <div className="grid grid-cols-3 gap-2">
                {['24 hours', '3 days', '1 week'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => handleDurationSelect(duration)}
                    className={`py-3 px-2 rounded-xl border-2 transition-all text-sm ${
                      formData.duration === duration
                        ? 'bg-lavender border-lavender text-dark-gray'
                        : 'bg-white border-gray-200 text-dark-gray hover:border-lavender/50'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
              
              {/* Other pause lengths dropdown */}
              <Select 
                value={formData.otherDuration} 
                onValueChange={handleOtherDurationSelect}
              >
                <SelectTrigger className={`bg-white border-2 rounded-xl py-3 px-4 transition-all ${
                  formData.otherDuration ? 'border-lavender bg-lavender' : 'border-gray-200 hover:border-lavender/50'
                }`}>
                  <SelectValue placeholder="Other pause lengths" className="placeholder:text-[#B0ABB7]" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 rounded-xl">
                  {otherPauseLengths.map((duration) => (
                    <SelectItem key={duration} value={duration} className="rounded-lg my-1">
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 bg-white border-gray-200 text-dark-gray hover:bg-gray-50 rounded-xl py-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 bg-lavender text-dark-gray hover:bg-lavender/90 rounded-xl py-3 relative overflow-hidden ${
                  isSubmitting ? 'pointer-events-none' : ''
                }`}
              >
                {isSubmitting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-dark-gray/20 rounded-full animate-ripple"></div>
                  </div>
                )}
                Start Pause
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
          <div className="flex justify-center gap-4">
            <button className="hover:text-taupe transition-colors">Privacy Policy</button>
            <button className="hover:text-taupe transition-colors">About</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseForm;
