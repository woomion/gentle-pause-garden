import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to extract og:image from HTML
function extractOgImageFromHtml(html: string): string | null {
  if (!html) return null;
  
  // Try og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch?.[1]) {
    console.log('🖼️ Found og:image in HTML:', ogImageMatch[1]);
    return ogImageMatch[1];
  }
  
  // Try twitter:image
  const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twitterImageMatch?.[1]) {
    console.log('🖼️ Found twitter:image in HTML:', twitterImageMatch[1]);
    return twitterImageMatch[1];
  }
  
  // Try to find product image in JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const data = JSON.parse(jsonContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type']?.includes?.('Product')) {
            const img = item.image;
            if (img) {
              const imageUrl = Array.isArray(img) ? img[0] : (typeof img === 'string' ? img : img?.url);
              if (imageUrl) {
                console.log('🖼️ Found product image in JSON-LD:', imageUrl);
                return imageUrl;
              }
            }
          }
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }
  }
  
  return null;
}

// Helper to do a scrape request and return structured data
async function doScrape(apiKey: string, formattedUrl: string, includeScreenshot = false) {
  console.log('🕷️ Using Firecrawl scrape mode');
  
  const formats = includeScreenshot 
    ? ['html', 'markdown', 'screenshot'] 
    : ['html', 'markdown'];
  
  const scrapePayload = {
    url: formattedUrl,
    formats,
    onlyMainContent: false,
    waitFor: 3000,
  };

  const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(scrapePayload),
  });

  const scrapeData = await scrapeRes.json();
  console.log('📋 Firecrawl scrape response success:', scrapeData.success);
  
  if (!scrapeRes.ok || !scrapeData.success) {
    console.error('❌ Scrape failed:', scrapeData.error);
    return { success: false, error: scrapeData.error || 'Firecrawl scrape failed' };
  }

  // Extract content from response
  const data = scrapeData.data || scrapeData;
  const html = data.html || null;
  const markdown = data.markdown || null;
  const screenshot = data.screenshot || null;
  const metadata = data.metadata || null;
  
  // Extract image from metadata first, then try parsing HTML directly
  let ogImage = metadata?.ogImage || metadata?.image || null;
  
  // If no ogImage from metadata, parse it from the HTML
  if (!ogImage && html) {
    ogImage = extractOgImageFromHtml(html);
  }
  
  console.log('✅ Scrape successful, html length:', html?.length || 0, 'ogImage:', ogImage);

  return { 
    success: true, 
    html, 
    markdown, 
    screenshot,
    ogImage, 
    metadata,
    content: html 
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { url, mode, schema, prompt } = await req.json().catch(() => ({}));
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('🔍 Processing URL:', formattedUrl, 'Mode:', mode);

    // Handle screenshot mode - just do a scrape with screenshot format
    if (mode === 'screenshot') {
      const result = await doScrape(apiKey, formattedUrl, true);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if this is extract mode request - try it but fallback to scrape
    if (mode === 'extract' && schema) {
      console.log('🎯 Trying Firecrawl extract mode with schema');
      
      try {
        const extractPayload = {
          urls: [formattedUrl],
          schema: schema,
          prompt: prompt || 'Extract detailed product information including name, current price, image URL, brand, and availability from this e-commerce page.'
        };

        const extractRes = await fetch('https://api.firecrawl.dev/v1/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(extractPayload),
        });

        const extractData = await extractRes.json();
        
        if (extractRes.ok && extractData.success) {
          // Check if this is an async job response
          if (extractData.id && !extractData.data) {
            console.log('🔄 Extract job started, polling for results...');
            
            // Poll for results with shorter timeout
            let attempts = 0;
            const maxAttempts = 8; // Reduce attempts to fail faster
            let resultData;
            
            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const statusRes = await fetch(`https://api.firecrawl.dev/v1/extract/${extractData.id}`, {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                },
              });
              
              resultData = await statusRes.json();
              console.log(`📋 Extract status attempt ${attempts + 1}:`, resultData.status);
              
              if (resultData.status === 'completed' && resultData.data) {
                const extracted = resultData.data || {};
                console.log('✅ Extract completed:', JSON.stringify(extracted, null, 2));
                return new Response(JSON.stringify({ success: true, extracted }), {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              } else if (resultData.status === 'failed') {
                console.log('⚠️ Extract job failed, falling back to scrape');
                break; // Fall through to scrape
              }
              
              attempts++;
            }
            
            // Extract timed out or failed - fallback to scrape
            console.log('⚠️ Extract timed out or failed, falling back to scrape');
          } else if (extractData.data) {
            // Immediate result
            const extracted = extractData.data?.[0] || extractData.data || {};
            console.log('✅ Immediate extracted data:', JSON.stringify(extracted, null, 2));
            return new Response(JSON.stringify({ success: true, extracted }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          console.log('⚠️ Extract request failed, falling back to scrape');
        }
      } catch (extractError) {
        console.log('⚠️ Extract error, falling back to scrape:', extractError);
      }
      
      // Fallback to scrape mode if extract failed
      console.log('🔄 Falling back to scrape mode after extract failure');
      const result = await doScrape(apiKey, formattedUrl, false);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default: Use scrape mode
    const result = await doScrape(apiKey, formattedUrl, false);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (e) {
    console.error('❌ Error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
