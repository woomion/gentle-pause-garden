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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/30">
      
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto space-y-10">
          <div className="space-y-6">
            {/* Pause Image */}
            <div className="flex justify-center">
              <img 
                src="/lovable-uploads/1358c375-933c-4b12-9b1e-e3b852c396df.png" 
                alt="Pocket Pause" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-2xl shadow-lg"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-purple-900 dark:text-purple-100 leading-tight font-inter">
                A moment between want and yes.
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-purple-700 dark:text-purple-200 leading-relaxed font-inter max-w-3xl mx-auto">
                A pause button for shopping. Paste a product link, choose how long to wait, and review later with clarity.
              </p>
            </div>
            
            <Button 
              asChild 
              className="bg-purple-600 text-white hover:bg-purple-700 font-semibold text-lg sm:text-xl py-6 sm:py-8 px-8 sm:px-12 gap-3 rounded-xl font-inter"
            >
              <Link to={appPath}>
                A Moment Between Want and Yes → Try It Free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-purple-900 dark:text-purple-100 mb-16 font-inter">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 font-inter">1</div>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-inter">Pause</h3>
              <p className="text-lg text-purple-700 dark:text-purple-200 font-inter">
                Drop a product link into Pocket Pause instead of buying right away.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 font-inter">2</div>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-inter">Wait</h3>
              <p className="text-lg text-purple-700 dark:text-purple-200 font-inter">
                It rests quietly in your Pause List for the time you choose.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 font-inter">3</div>
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-inter">Review</h3>
              <p className="text-lg text-purple-700 dark:text-purple-200 font-inter">
                When the pause is up, it returns — so you can decide with space.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              asChild 
              className="bg-purple-600 text-white hover:bg-purple-700 font-semibold text-lg sm:text-xl py-6 px-8 gap-3 rounded-xl font-inter"
            >
              <Link to={appPath}>
                Pause Your First Link
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-20 px-4 bg-purple-50/50 dark:bg-purple-900/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-purple-900 dark:text-purple-100 mb-16 font-inter">
            Why Pocket Pause Matters
          </h2>
          
          <div className="space-y-8 text-center">
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 dark:text-purple-100 italic font-inter">
              Clarity lives in the pause.
            </p>
            
            <div className="space-y-6 text-lg sm:text-xl text-purple-700 dark:text-purple-200 font-inter max-w-3xl mx-auto">
              <p>Impulse fades — what you truly value stays.</p>
              <p>No guilt, no judgment — Pocket Pause isn't about saying no, it's about choosing yes with ease.</p>
              <p>Conscious shopping — build a list that reflects what you actually want, not just what caught your eye.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <blockquote className="text-center p-8 bg-white/50 dark:bg-purple-900/20 rounded-2xl">
              <p className="text-lg italic text-purple-700 dark:text-purple-200 font-inter mb-4">
                "I didn't realize how many things I didn't actually want until I paused first."
              </p>
            </blockquote>
            
            <blockquote className="text-center p-8 bg-white/50 dark:bg-purple-900/20 rounded-2xl">
              <p className="text-lg italic text-purple-700 dark:text-purple-200 font-inter mb-4">
                "It makes me feel lighter — like I have control, but without pressure."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Closing CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-900 dark:text-purple-100 font-inter">
              Shopping with space feels better.
            </h2>
            <p className="text-xl sm:text-2xl text-purple-700 dark:text-purple-200 font-inter">
              It's not about less. It's about clarity.
            </p>
          </div>
          
          <Button 
            asChild 
            className="bg-purple-600 text-white hover:bg-purple-700 font-semibold text-xl sm:text-2xl py-6 sm:py-8 px-8 sm:px-12 gap-3 rounded-xl font-inter"
          >
            <Link to={appPath}>
                Pause Now, Decide Later
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-purple-200 dark:border-purple-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-purple-600 dark:text-purple-300 font-inter">
            Pocket Pause · Your conscious spending companion
          </p>
        </div>
      </footer>
      
    </div>
  );
};

export default GetApp;