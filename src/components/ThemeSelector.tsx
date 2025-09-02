import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Lock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export function ThemeSelector() {
  const { colorTheme, setColorTheme } = useTheme();
  const { isPremiumUser } = useSubscription();

  const themes = [
    {
      id: 'lavender' as const,
      name: 'Lavender',
      description: 'Calming experience',
      preview: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(270, 60%, 85%))',
      isPremium: false,
    },
  ];

  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme?.isPremium && !isPremiumUser()) {
      // Could show upgrade modal here
      return;
    }
    setColorTheme(themeId as any);
  };

  return (
    <div className="grid gap-3">
      {themes.map((theme) => {
        const isLocked = theme.isPremium && !isPremiumUser();
        const isDisabled = isLocked && colorTheme !== theme.id;
        
        return (
          <Card
            key={theme.id}
            className={`transition-all border ${
              isDisabled 
                ? 'opacity-60 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-md'
            } ${
              colorTheme === theme.id
                ? 'border-primary border-2 shadow-md'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => !isDisabled && handleThemeSelect(theme.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                  style={{ background: theme.preview }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{theme.name}</h4>
                    {theme.isPremium && !isPremiumUser() && (
                      <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {colorTheme === theme.id && (
                      <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {theme.description}
                    {theme.isPremium && !isPremiumUser() && ' • Premium'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}