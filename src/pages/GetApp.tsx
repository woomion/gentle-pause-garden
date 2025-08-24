import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/30 flex items-center justify-center px-4">
      <div className="text-center max-w-lg mx-auto space-y-10">
        <div className="space-y-6">
          {/* Pause Image */}
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
              alt="Pocket Pause" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-lg"
            />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple-900 dark:text-purple-100 leading-tight font-inter">
              Pocket Pause
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-purple-700 dark:text-purple-200 leading-relaxed font-inter italic">
              A little space before you buy.
            </p>
          </div>
        </div>
        
        <div className="space-y-6">
          <Input 
            placeholder="Paste a link. Pause. Review later." 
            className="text-center text-lg sm:text-xl py-4 bg-white/70 border-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-400 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-100 dark:placeholder:text-purple-300"
            disabled
          />
          
          <Button 
            asChild 
            className="w-full bg-purple-600 text-white hover:bg-purple-700 font-semibold text-xl sm:text-2xl py-6 sm:py-8 gap-3 rounded-xl"
          >
            <Link to={appPath}>
              Start for Free
              <ArrowRight size={24} className="sm:size-6" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GetApp;