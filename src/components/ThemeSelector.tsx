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
      description: 'Calming experience',
      preview: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(270, 60%, 85%))',
    },
    {
      id: 'sporty' as const,
      name: 'Sporty Orange',
      description: 'Active mindset',
      preview: 'linear-gradient(135deg, hsl(35, 100%, 55%), hsl(35, 60%, 85%))',
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      description: 'Focused simplicity',
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
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                  style={{ background: theme.preview }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{theme.name}</h4>
                    {colorTheme === theme.id && (
                      <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
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