import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { PauseCircle, Wallet, Bell, BarChart3, ShieldCheck, Cloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const GetApp = () => {
  const { isInstallable, promptInstall } = usePWAInstallPrompt();
  const { toast } = useToast();
  const { user } = useAuth();
  const appPath = user ? "/" : "/auth";
  const appUrl = `${window.location.origin}${appPath}`;

  useEffect(() => {
    // SEO: title, meta description, canonical
    const title = "Install Pocket Pause — Conscious spending app";
    document.title = title;

    const descContent = "Install the Pocket Pause app on iOS, Android, or desktop. Pause before you purchase with mindful spending.";
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
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-hero-miro" />
        <div className="absolute inset-0 -z-10 hero-blob-contrast" />
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div className="text-center flex flex-col items-center gap-1">
            <Link to="/" className="text-foreground font-medium text-lg tracking-wide hover:text-muted-foreground transition-colors">
              Pocket Pause
            </Link>
            <Link to="/?guest=1&pill=1" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
              Open app (Guest preview)
            </Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-28 sm:py-32 text-center">
          <p className="inline-flex items-center rounded-full border border-foreground/20 bg-foreground/5 px-3 py-1 text-xs text-foreground/90 backdrop-blur">
            Mindful spending, minus the guilt
          </p>
          <h1 className="mt-4 text-5xl sm:text-6xl font-bold tracking-tight text-foreground text-balance">Pause before you purchase</h1>
          <p className="mt-4 text-foreground/80 max-w-2xl mx-auto">Capture wants, reflect with prompts, and buy with clarity.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isInstallable ? (
              <Button onClick={promptInstall} size="xl" shape="pill">Install Pocket Pause</Button>
            ) : (
              <Button asChild size="xl" shape="pill">
                <Link to={appPath}>Open app</Link>
              </Button>
            )}
            <Button variant="outline" size="xl" shape="pill" onClick={copyLink}>Copy app link</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        {/* Benefits */}
        <section aria-labelledby="features">
          <div className="flex items-center justify-between">
            <h2 id="features" className="text-xl font-semibold text-foreground">Why Pocket Pause</h2>
          </div>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2">
            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <PauseCircle className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Pause before you purchase</h3>
                <p className="text-sm text-muted-foreground">Save links and notes when the impulse hits. Put it on pause instead of in the cart.</p>
              </div>
            </li>

            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <Wallet className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Spend with your values</h3>
                <p className="text-sm text-muted-foreground">Reflect on alignment, joy, and timing—then buy with confidence or let it go.</p>
              </div>
            </li>

            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Gentle nudges</h3>
                <p className="text-sm text-muted-foreground">Optional reminders to review paused items when it's actually a good moment.</p>
              </div>
            </li>

            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">See your progress</h3>
                <p className="text-sm text-muted-foreground">Track decisions and savings over time to build better habits.</p>
              </div>
            </li>

            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Private by design</h3>
                <p className="text-sm text-muted-foreground">Your data stays yours. We use secure, privacy‑first infrastructure.</p>
              </div>
            </li>

            <li className="flex items-start gap-4 animate-fade-in">
              <span className="rounded-full bg-primary/10 p-2">
                <Cloud className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">Works anywhere</h3>
                <p className="text-sm text-muted-foreground">Install on iOS, Android, or desktop as a PWA—offline support included.</p>
              </div>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default GetApp;