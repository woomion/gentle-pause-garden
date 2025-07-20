import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Bookmark, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Bookmarklet = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = `javascript:(function(){
    const extractProductInfo = () => {
      let title = document.title;
      let price = null;
      let imageUrl = null;
      let url = window.location.href;
      
      // Amazon extraction
      if (url.includes('amazon.')) {
        title = document.querySelector('#productTitle')?.textContent?.trim() || 
                document.querySelector('.product-title')?.textContent?.trim() || title;
        price = document.querySelector('.a-price-whole')?.textContent?.trim() ||
                document.querySelector('.a-price')?.textContent?.trim();
        imageUrl = document.querySelector('#landingImage')?.src ||
                   document.querySelector('.a-dynamic-image')?.src;
      }
      
      // Target extraction
      else if (url.includes('target.com')) {
        title = document.querySelector('[data-test="product-title"]')?.textContent?.trim() ||
                document.querySelector('h1')?.textContent?.trim() || title;
        price = document.querySelector('[data-test="product-price"]')?.textContent?.trim();
        imageUrl = document.querySelector('[data-test="hero-image-desktop"] img')?.src ||
                   document.querySelector('.HeroImage img')?.src;
      }
      
      // Walmart extraction
      else if (url.includes('walmart.com')) {
        title = document.querySelector('#main-title')?.textContent?.trim() ||
                document.querySelector('h1')?.textContent?.trim() || title;
        price = document.querySelector('[data-testid="price-display"]')?.textContent?.trim();
        imageUrl = document.querySelector('[data-testid="hero-image"]')?.src;
      }
      
      // Best Buy extraction
      else if (url.includes('bestbuy.com')) {
        title = document.querySelector('.sr-only')?.textContent?.trim() ||
                document.querySelector('h1')?.textContent?.trim() || title;
        price = document.querySelector('.sr-only')?.textContent?.trim();
        imageUrl = document.querySelector('.primary-image')?.src;
      }
      
      // Generic extraction fallback
      else {
        const h1 = document.querySelector('h1');
        if (h1) title = h1.textContent?.trim() || title;
        
        // Try common price selectors
        const priceSelectors = ['.price', '[data-price]', '.cost', '.amount', '.currency'];
        for (const selector of priceSelectors) {
          const priceEl = document.querySelector(selector);
          if (priceEl) {
            price = priceEl.textContent?.trim();
            break;
          }
        }
        
        // Try to find main product image
        const imgSelectors = ['[data-main-image]', '.main-image', '.product-image', '.hero-image'];
        for (const selector of imgSelectors) {
          const img = document.querySelector(selector + ' img') || document.querySelector(selector);
          if (img?.src) {
            imageUrl = img.src;
            break;
          }
        }
      }
      
      return { title, price, imageUrl, url };
    };
    
    const productInfo = extractProductInfo();
    
    // Open Pocket Pause with pre-filled data
    const baseUrl = '${window.location.origin}';
    const params = new URLSearchParams({
      title: productInfo.title,
      url: productInfo.url,
      price: productInfo.price || '',
      image: productInfo.imageUrl || '',
      source: 'bookmarklet'
    });
    
    window.open(\`\${baseUrl}?add=1&\${params.toString()}\`, '_blank');
  })();`.replace(/\s+/g, ' ').trim();

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Bookmarklet code copied to clipboard. Now drag it to your bookmarks bar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy bookmarklet. Please copy manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pocket Pause Bookmarklet</h1>
          <p className="text-muted-foreground">
            Save items from any website with one click using our bookmarklet tool.
          </p>
        </div>

        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              A bookmarklet is a bookmark that runs JavaScript code. It allows you to save items to Pocket Pause 
              from any shopping website with just one click.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Install Bookmarklet
              </CardTitle>
              <CardDescription>
                Follow these steps to add the Pocket Pause bookmarklet to your browser:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Step 1: Copy the bookmarklet code</h3>
                <div className="relative">
                  <textarea
                    value={bookmarkletCode}
                    readOnly
                    className="w-full h-32 p-3 text-sm bg-muted rounded-md resize-none font-mono"
                  />
                  <Button
                    onClick={copyBookmarklet}
                    className="absolute top-2 right-2"
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 2: Create a new bookmark</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Right-click on your browser's bookmarks bar</li>
                  <li>Select "Add bookmark" or "New bookmark"</li>
                  <li>Name it "Pocket Pause" (or whatever you prefer)</li>
                  <li>Paste the copied code into the URL/Location field</li>
                  <li>Save the bookmark</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Step 3: Use the bookmarklet</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Navigate to any shopping website (Amazon, Target, etc.)</li>
                  <li>Go to a product page you want to pause</li>
                  <li>Click your "Pocket Pause" bookmark</li>
                  <li>A new tab will open with the product pre-filled in Pocket Pause</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Websites</CardTitle>
              <CardDescription>
                The bookmarklet works best on these popular shopping sites:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Amazon', 'Target', 'Walmart', 'Best Buy',
                  'eBay', 'Etsy', 'Shopify stores', 'Most retail sites'
                ].map((site) => (
                  <div key={site} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{site}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The bookmarklet will also work on other websites, though product information extraction 
                may be more basic on unsupported sites.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium">Bookmarklet doesn't work?</h4>
                <p className="text-sm text-muted-foreground">
                  Make sure you copied the entire code including "javascript:" at the beginning.
                </p>
              </div>
              <div>
                <h4 className="font-medium">No product information extracted?</h4>
                <p className="text-sm text-muted-foreground">
                  The bookmarklet will still capture the page title and URL. You can manually add 
                  product details in Pocket Pause.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Popup blocked?</h4>
                <p className="text-sm text-muted-foreground">
                  Allow popups for the website you're browsing to enable the bookmarklet to open 
                  Pocket Pause in a new tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Bookmarklet;