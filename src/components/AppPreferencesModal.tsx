import React from 'react';
import { X, Palette, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';

interface AppPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppPreferencesModal: React.FC<AppPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, actualTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-start justify-center px-4 pt-16">
      <div className="bg-card rounded-2xl max-w-md w-full p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            App Preferences
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Light/Dark Theme Toggle */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Monitor size={16} />
              Theme Mode
            </Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                ☀️ Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                🌙 Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                💻 Auto
              </Button>
            </div>
          </div>

          {/* Color Theme Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette size={16} />
              Color Theme
            </Label>
            <ThemeSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreferencesModal;