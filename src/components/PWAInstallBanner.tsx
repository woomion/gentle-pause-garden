import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstallPrompt } from '@/hooks/usePWAInstallPrompt';

const PWAInstallBanner = () => {
  const { isInstallable, promptInstall, dismiss } = usePWAInstallPrompt();
  if (!isInstallable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-sm md:max-w-lg lg:max-w-2xl px-4">
        <div className="mt-2 rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="text-sm">
              <div className="font-medium">Install Pocket Pause</div>
              <div className="text-xs text-muted-foreground">Faster access and offline support</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={promptInstall}>Install</Button>
              <button aria-label="Dismiss install banner" onClick={dismiss} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
