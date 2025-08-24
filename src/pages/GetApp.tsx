import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const GetApp = () => {
  const { user } = useAuth();
  const appPath = user ? "/" : "/auth";

  useEffect(() => {
    // SEO: title, meta description, canonical
    const title = "Pocket Pause - A little space before you buy";
    document.title = title;

    const descContent = "Paste a link. Pause. Review later. Simple mindful spending app.";
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

  return (
    <div className="min-h-screen bg-[#200E3B] flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Pocket Pause
          </h1>
          <p className="text-lg text-white/80">
            A little space before you buy.
          </p>
        </div>
        
        <div className="space-y-4">
          <Input 
            placeholder="Paste a link. Pause. Review later." 
            className="text-center bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
            disabled
          />
          
          <Button 
            asChild 
            className="w-full bg-white text-[#200E3B] hover:bg-white/90 font-semibold text-lg py-6"
          >
            <Link to={appPath}>
              👉 Start Free
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GetApp;