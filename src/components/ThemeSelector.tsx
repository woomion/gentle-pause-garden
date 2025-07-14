import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useTheme, themes, ThemeName } from '../contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

interface ThemeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ThemeSelector = ({ open, onOpenChange }: ThemeSelectorProps) => {
  const { currentTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(currentTheme);

  const handleThemeSelect = (theme: ThemeName) => {
    setSelectedTheme(theme);
    setTheme(theme);
    
    // Show confirmation toast
    toast({
      title: "Theme applied",
      description: `${themes[theme].name} theme is now active`,
    });

    // Add a small bounce animation to the applied theme
    const element = document.querySelector(`[data-theme="${theme}"]`);
    if (element) {
      element.classList.add('animate-bounce');
      setTimeout(() => {
        element.classList.remove('animate-bounce');
      }, 600);
    }
  };

  const getPreviewSwatches = (theme: ThemeName) => {
    const colors = themes[theme].colors;
    return [
      colors.background,
      colors.buttons,
      colors.accent,
      colors.borders
    ];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
            Choose Your Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              data-theme={key}
              className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                selectedTheme === key
                  ? 'border-purple bg-white/80 dark:bg-white/20'
                  : 'border-gray-200 dark:border-white/20 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20'
              }`}
              onClick={() => handleThemeSelect(key as ThemeName)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">
                    {theme.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {theme.description}
                  </p>
                </div>
                {selectedTheme === key && (
                  <Check className="w-5 h-5 text-purple" />
                )}
              </div>
              
              {/* Preview Swatches */}
              <div className="flex space-x-2 mb-3">
                {getPreviewSwatches(key as ThemeName).map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <Button
                variant={selectedTheme === key ? "default" : "outline"}
                size="sm"
                className={`w-full ${
                  selectedTheme === key
                    ? 'bg-purple hover:bg-purple/90 text-white'
                    : 'bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border-gray-300 dark:border-gray-600 text-black dark:text-[#F9F5EB]'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeSelect(key as ThemeName);
                }}
              >
                {selectedTheme === key ? 'Applied' : 'Apply'}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;