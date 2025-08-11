import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface FirecrawlCrawlResponse {
  success: boolean;
  data?: any;
  error?: string;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = {
      url,
      limit: 1,
      scrapeOptions: { formats: ['html', 'markdown'] },
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
    if (!fcRes.ok || !data.success) {
      return new Response(JSON.stringify({ error: data.error || 'Firecrawl request failed' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // Extract a reasonable html/markdown payload
    let html: string | null = null;
    let markdown: string | null = null;
    const first = Array.isArray(data.data) ? data.data[0] : (data.data || {});
    html = first?.html || first?.content?.html || first?.content || null;
    markdown = first?.markdown || first?.md || null;

    return new Response(JSON.stringify({ html, markdown }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
