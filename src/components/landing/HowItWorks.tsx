import React from "react";
import { PauseCircle, ListChecks, CheckCircle2 } from "lucide-react";

const HowItWorks: React.FC = () => {
  return (
    <section aria-labelledby="how-it-works" className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 id="how-it-works" className="text-xl font-semibold text-foreground">How it works</h2>
      </div>
      <ol className="mt-6 grid gap-6 md:grid-cols-3">
        <li className="flex items-start gap-4">
          <span className="rounded-full bg-primary/10 p-2">
            <PauseCircle className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Capture the impulse</h3>
            <p className="text-sm text-muted-foreground">Save a link or jot a quick note the moment you feel the urge.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <span className="rounded-full bg-primary/10 p-2">
            <ListChecks className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Reflect with prompts</h3>
            <p className="text-sm text-muted-foreground">Check alignment, timing, and joy—without the pressure to buy.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <span className="rounded-full bg-primary/10 p-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground">Decide with confidence</h3>
            <p className="text-sm text-muted-foreground">Buy it, delay it, or let it go—and see your savings add up.</p>
          </div>
        </li>
      </ol>
    </section>
  );
};

export default HowItWorks;
