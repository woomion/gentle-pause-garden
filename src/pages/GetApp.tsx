import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Smartphone, PauseCircle, Wallet, Bell, BarChart3, ShieldCheck, Cloud } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import HowItWorks from "@/components/landing/HowItWorks";
import Testimonials from "@/components/landing/Testimonials";
import PrivacySection from "@/components/landing/PrivacySection";
import StickyInstallBar from "@/components/landing/StickyInstallBar";

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
    // SEO: title, meta description, canonical, structured data
    const title = "Install Pocket Pause — Conscious spending app";
    document.title = title;

    const descContent = "Install the Pocket Pause app on iOS, Android, or desktop. Learn how it works and start pausing impulse buys.";
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

    // FAQ structured data
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I install Pocket Pause?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "On iOS, open in Safari and use Add to Home Screen. On Android/Desktop, use your browser's Install option."
          }
        },
        {
          "@type": "Question",
          name: "Is there anything to download?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pocket Pause is a Progressive Web App (PWA). Your browser installs it without a traditional download."
          }
        },
        {
          "@type": "Question",
          name: "Does it work offline?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, the app caches key features so you can add pauses and review them even with spotty connection."
          }
        }
      ]
    };
    let ld = document.querySelector('script[data-faq-ld="getapp"]') as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.setAttribute("data-faq-ld", "getapp");
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(faqLd);
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
        <div className="absolute inset-0 -z-10 bg-gradient-brand" />
        <div className="absolute inset-0 -z-10 hero-blob" />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="inline-flex items-center rounded-full border border-background/30 bg-background/20 px-3 py-1 text-xs text-primary-foreground/90 backdrop-blur">
            Mindful spending, minus the guilt
          </p>
          <h1 className="mt-4 text-5xl sm:text-6xl font-bold tracking-tight text-primary-foreground text-balance">Pause before you purchase</h1>
          <p className="mt-4 text-primary-foreground/90 max-w-2xl mx-auto">Capture wants, reflect with prompts, and buy with clarity.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {platform.isIOS ? (
              <Button asChild size="xl" shape="pill">
                <a href="#install" className="focus:outline-none">How to install on iOS</a>
              </Button>
            ) : isInstallable ? (
              <Button onClick={promptInstall} size="xl" shape="pill">Install Pocket Pause</Button>
            ) : (
              <Button asChild size="xl" shape="pill">
                <a href="#install" className="focus:outline-none">How to install</a>
              </Button>
            )}
            <Button variant="outline" size="xl" shape="pill" onClick={copyLink}>Copy app link</Button>
            <Button asChild variant="link" className="text-primary-foreground">
              <Link to={appPath} className="inline-flex items-center gap-1">
                Open app <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-12">
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
                <p className="text-sm text-muted-foreground">Optional reminders to review paused items when it’s actually a good moment.</p>
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

        <HowItWorks />

        {/* Screenshots */}
        <section aria-labelledby="screenshots">
          <div className="flex items-center justify-between">
            <h2 id="screenshots" className="text-xl font-semibold text-foreground">A quick look</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <img
              src="/lovable-uploads/e80ad720-84cd-484f-9a75-4b83ade80b53.png"
              alt="Pocket Pause app screenshot showing the pause input"
              className="w-full rounded-md border border-border object-cover"
              loading="lazy"
            />
            <img
              src="/lovable-uploads/1367d743-1b24-47dd-adba-c17931d597c6.png"
              alt="Pocket Pause review screen with thoughtful prompts"
              className="w-full rounded-md border border-border object-cover"
              loading="lazy"
            />
            <img
              src="/lovable-uploads/760792e5-34ff-4bc0-925c-bca522d834ed.png"
              alt="Pocket Pause stats tracking progress and savings"
              className="w-full rounded-md border border-border object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <Testimonials />

        {/* Install section */}
        <section id="install" aria-labelledby="install-heading" className="grid gap-6 md:grid-cols-2">
          <h2 id="install-heading" className="sr-only">Install Pocket Pause</h2>
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

        <PrivacySection />

        {/* FAQ */}
        <section aria-labelledby="faq" className="max-w-3xl">
          <h2 id="faq" className="text-xl font-semibold text-foreground">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            <details className="rounded-md border border-border p-4">
              <summary className="cursor-pointer font-medium">How do I install Pocket Pause?</summary>
              <p className="mt-2 text-sm text-muted-foreground">On iOS, open in Safari and use Add to Home Screen. On Android/Desktop, use your browser’s Install option.</p>
            </details>
            <details className="rounded-md border border-border p-4">
              <summary className="cursor-pointer font-medium">Is there anything to download?</summary>
              <p className="mt-2 text-sm text-muted-foreground">No separate download—this is a Progressive Web App (PWA). Your browser installs it directly.</p>
            </details>
            <details className="rounded-md border border-border p-4">
              <summary className="cursor-pointer font-medium">Does it work offline?</summary>
              <p className="mt-2 text-sm text-muted-foreground">Yes. Key features are cached so you can add pauses and review them without a perfect connection.</p>
            </details>
          </div>
        </section>
      </main>

      <StickyInstallBar />
    </div>
  );
};

export default GetApp;
