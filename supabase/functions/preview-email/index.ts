import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { ReviewReminderEmail } from '../send-review-reminders/_templates/review-reminder.tsx';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Demo data for preview
    const demoItems = [
      {
        id: '1',
        title: 'Wireless Noise-Cancelling Headphones',
        store_name: 'Amazon',
        price: 299.99,
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      },
      {
        id: '2', 
        title: 'Premium Coffee Maker',
        store_name: 'Williams Sonoma',
        price: 189.50,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        id: '3',
        title: 'Running Shoes',
        store_name: 'Nike',
        price: 120.00,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      }
    ];

    const appUrl = 'https://cnjznmbgxprsrovmdywe.lovable.dev';
    const longPausedCount = 2; // Items paused for more than 10 days

    // Generate the email HTML
    const emailHtml = await renderAsync(
      React.createElement(ReviewReminderEmail, {
        reviewItems: demoItems,
        appUrl,
        longPausedCount,
      })
    );

    return new Response(emailHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in preview-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);