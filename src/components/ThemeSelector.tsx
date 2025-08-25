import React from 'react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

export function ThemeSelector() {
  const { colorTheme, setColorTheme } = useTheme();

  const themes = [
    {
      id: 'lavender' as const,
      name: 'Lavender',
      description: 'Soft purple tones for a calming experience',
      preview: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(270, 60%, 85%))',
    },
    {
      id: 'sporty' as const,
      name: 'Sporty Orange',
      description: 'Energetic orange for an active mindset',
      preview: 'linear-gradient(135deg, hsl(35, 100%, 55%), hsl(35, 60%, 85%))',
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      description: 'Clean black and white for focused simplicity',
      preview: 'linear-gradient(135deg, hsl(0, 0%, 20%), hsl(0, 0%, 90%))',
    },
  ];

  return (
    <div className="grid gap-3">
      {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              colorTheme === theme.id
                ? 'ring-2 ring-primary shadow-md'
                : 'hover:ring-1 hover:ring-border'
            }`}
            onClick={() => setColorTheme(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-background shadow-sm"
                  style={{ background: theme.preview }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{theme.name}</h4>
                    {colorTheme === theme.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}