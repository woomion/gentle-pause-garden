import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('🔍 Processing URL:', formattedUrl, 'Mode:', mode);

    // Check if this is extract mode request
    if (mode === 'extract' && schema) {
      console.log('🎯 Using Firecrawl extract mode with schema');
      
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
        const maxAttempts = 15;
        let resultData;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const statusRes = await fetch(`https://api.firecrawl.dev/v1/extract/${extractData.id}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
          
          resultData = await statusRes.json();
          console.log(`📋 Extract status attempt ${attempts + 1}:`, resultData.status);
          
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
        const extracted = resultData.data || {};
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

    // Use /v1/scrape for single-page synchronous scraping (HTML/markdown extraction)
    console.log('🕷️ Using Firecrawl scrape mode (synchronous)');
    
    const scrapePayload = {
      url: formattedUrl,
      formats: ['html', 'markdown'],
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
      return new Response(JSON.stringify({ error: scrapeData.error || 'Firecrawl scrape failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract content from response - /v1/scrape returns data directly
    const html = scrapeData.data?.html || scrapeData.html || null;
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || null;
    
    console.log('✅ Scrape successful, html length:', html?.length || 0, 'markdown length:', markdown?.length || 0);

    return new Response(JSON.stringify({ html, markdown, content: html }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('❌ Error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
