import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PauseCircle, ListChecks, BarChart3 } from "lucide-react";

const PhoneFrame: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <Card className="border-border/80">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
    </CardHeader>
    <CardContent>
      <AspectRatio ratio={9 / 19}>
        <div className="h-full w-full rounded-[1.75rem] border border-border bg-card p-2">
          <div className="h-full w-full rounded-3xl border border-border bg-background overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </AspectRatio>
    </CardContent>
  </Card>
);

const PausePreview = () => (
  <PhoneFrame label="Quick Pause">
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <PauseCircle className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium text-foreground">Pocket Pause</span>
    </div>
    <div className="p-4 space-y-3">
      <Input placeholder="Paste a link or note…" />
      <Button size="sm" className="w-full">Pause it</Button>
      <div className="mt-2 rounded-md border border-border p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground truncate">Running shoes I liked</p>
          <Badge className="shrink-0" variant="secondary">waiting</Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">Give it three days, check other pairs</p>
      </div>
    </div>
  </PhoneFrame>
);

const ReviewPreview = () => (
  <PhoneFrame label="Reflect & decide">
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <ListChecks className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium text-foreground">Review</span>
    </div>
    <div className="p-4 flex flex-col gap-3">
      <div className="rounded-md border border-border p-3">
        <p className="text-xs font-medium text-foreground">“Does this align with what matters this month?”</p>
        <p className="mt-1 text-xs text-muted-foreground">Nike Pegasus 41</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" variant="secondary">Let it go</Button>
        <Button size="sm" variant="default">Buy later</Button>
      </div>
    </div>
  </PhoneFrame>
);

const StatsPreview = () => (
  <PhoneFrame label="See progress">
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <BarChart3 className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium text-foreground">Stats</span>
    </div>
    <div className="p-4 flex flex-col gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Estimated saved</p>
        <p className="text-lg font-semibold text-foreground">$128 this month</p>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Let go</span>
            <span>60%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-3/5 rounded-full bg-primary" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Buy later</span>
            <span>25%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-1/4 rounded-full bg-primary/70" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Buy now</span>
            <span>15%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-[15%] rounded-full bg-primary/50" />
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

const AppMockPreviews: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <PausePreview />
      <ReviewPreview />
      <StatsPreview />
    </div>
  );
};

export default AppMockPreviews;
