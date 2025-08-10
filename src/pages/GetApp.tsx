import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const GetApp = () => {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();
  const { toast } = useToast();
  const { user } = useAuth();
  const appPath = user ? "/" : "/auth";
  const appUrl = `${window.location.origin}${appPath}`;

  const platform = useMemo(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    const isAndroid = /Android/.test(ua);
    return { isIOS, isAndroid };
  }, []);

  useEffect(() => {
    // SEO: title, meta description, canonical
    const title = "Get Pocket Pause — Install the Pocket Pause App";
    document.title = title;

    const descContent = "Install the Pocket Pause app on iOS, Android, or desktop. Add to Home Screen or use the Install button.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = descContent;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`;
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      toast({ title: "Link copied", description: "App link copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground">Get Pocket Pause</h1>
          <p className="text-muted-foreground mt-1">Install the app for faster access and offline support</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install on your device
              </CardTitle>
              <CardDescription>
                {platform.isAndroid ? "Android devices" : platform.isIOS ? "iOS devices" : "Desktop browsers"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.isIOS ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>On iPhone or iPad using Safari:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Tap the Share icon</li>
                    <li>Select "Add to Home Screen"</li>
                    <li>Tap Add</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  {isInstallable ? (
                    <Button onClick={promptInstall}>Install Pocket Pause</Button>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        In Chrome or Edge, use the browser menu and choose Install app. On desktop, you may also see an
                        Install icon in the address bar.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={copyLink}>Copy app link</Button>
                        <Button asChild variant="link">
                          <Link to={appPath} className="inline-flex items-center gap-1">
                            Open app <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save from any website</CardTitle>
              <CardDescription>Use our bookmarklet when share targets aren’t available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                iOS doesn’t support install prompts, but you can still save products quickly using our bookmarklet.
              </p>
              <Button asChild>
                <Link to="/bookmarklet">Open Bookmarklet Guide</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default GetApp;
