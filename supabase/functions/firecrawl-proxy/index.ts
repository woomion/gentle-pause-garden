import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface FirecrawlCrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if this is extract mode request
    if (mode === 'extract' && schema) {
      console.log('🎯 Using Firecrawl extract mode with schema');
      
      const extractPayload = {
        urls: [url],
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
      console.log('📋 Firecrawl extract response:', JSON.stringify(extractData, null, 2));
      
      if (!extractRes.ok || !extractData.success) {
        console.error('❌ Extract failed:', extractData.error);
        return new Response(JSON.stringify({ error: extractData.error || 'Firecrawl extract failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Check if this is an async job response
      if (extractData.id && !extractData.data) {
        console.log('🔄 Extract job started, polling for results...');
        
        // Poll for results
        let attempts = 0;
        const maxAttempts = 10;
        let resultData;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const statusRes = await fetch(`https://api.firecrawl.dev/v1/extract/${extractData.id}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
          
          resultData = await statusRes.json();
          console.log(`📋 Extract status attempt ${attempts + 1}:`, JSON.stringify(resultData, null, 2));
          
          if (resultData.status === 'completed' && resultData.data) {
            break;
          } else if (resultData.status === 'failed') {
            console.error('❌ Extract job failed:', resultData.error);
            return new Response(JSON.stringify({ error: resultData.error || 'Extract job failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          attempts++;
        }
        
        if (!resultData?.data) {
          console.error('❌ Extract job timed out or failed');
          return new Response(JSON.stringify({ error: 'Extract job timed out' }), { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        // Return extracted data from polling
        const extracted = resultData.data?.[0] || {};
        console.log('✅ Final extracted data:', JSON.stringify(extracted, null, 2));
        return new Response(JSON.stringify({ extracted }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return extracted data immediately if available
      const extracted = extractData.data?.[0] || {};
      console.log('✅ Immediate extracted data:', JSON.stringify(extracted, null, 2));
      return new Response(JSON.stringify({ extracted }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Original crawl mode for HTML/markdown extraction
    console.log('🕷️ Using Firecrawl crawl mode');
    
    const payload = {
      url,
      limit: 1,
      scrapeOptions: { 
        formats: ['html', 'markdown'],
        waitFor: 2000,
        timeout: 15000
      },
    };

    const fcRes = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data: FirecrawlCrawlResponse = await fcRes.json();
    console.log('📋 Firecrawl crawl response status:', data.success);
    
    if (!fcRes.ok || !data.success) {
      console.error('❌ Crawl failed:', data.error);
      return new Response(JSON.stringify({ error: data.error || 'Firecrawl request failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract a reasonable html/markdown payload
    let html: string | null = null;
    let markdown: string | null = null;
    const first = Array.isArray(data.data) ? data.data[0] : (data.data || {});
    html = first?.html || first?.content?.html || first?.content || null;
    markdown = first?.markdown || first?.md || null;

    return new Response(JSON.stringify({ html, markdown }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
