import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const StickyInstallBar: React.FC = () => {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();
  const { toast } = useToast();
  const { user } = useAuth();
  const appPath = user ? "/" : "/auth";
  const appUrl = `${window.location.origin}${appPath}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast({ title: "Link copied", description: "App link copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually", variant: "destructive" });
    }
  };

  return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-brand-yellow text-brand-yellow-foreground">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">Ready when you are.</p>
          <div className="flex items-center gap-2">
            {isInstallable ? (
              <Button onClick={promptInstall} size="sm" shape="pill">Install Pocket Pause</Button>
            ) : (
              <>
                <Button asChild size="sm" shape="pill">
                  <Link to={appPath}>Open app</Link>
                </Button>
                <Button asChild variant="outline" size="sm" shape="pill">
                  <a href="#install">How to install</a>
                </Button>
                <Button variant="ghost" size="sm" shape="pill" onClick={copyLink}>Copy link</Button>
              </>
            )}
          </div>
        </div>
      </div>
  );
};

export default StickyInstallBar;
