import React from "react";
import { ShieldCheck } from "lucide-react";

const PrivacySection: React.FC = () => {
  return (
    <section aria-labelledby="privacy" className="max-w-5xl mx-auto py-12 sm:py-16">
      <div className="flex items-center justify-between">
        <h2 id="privacy" className="text-xl font-semibold text-foreground">Your privacy, protected</h2>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <p className="text-sm text-muted-foreground">Private by design—your data stays yours.</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <p className="text-sm text-muted-foreground">Secure infrastructure and optional offline support.</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-primary/10 p-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </span>
          <p className="text-sm text-muted-foreground">No trackers that pressure you to buy.</p>
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;
