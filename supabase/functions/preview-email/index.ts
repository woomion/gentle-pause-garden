import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface ReviewItem {
  id: string;
  title: string;
  store_name?: string;
  price?: number;
  created_at: string;
}

interface ReviewReminderEmailProps {
  reviewItems: ReviewItem[];
  appUrl: string;
  longPausedCount: number;
}

const ReviewReminderEmail = ({
  reviewItems,
  appUrl,
  longPausedCount,
}: ReviewReminderEmailProps) => {
  const formatPrice = (price: number | null) => {
    if (!price) return '';
    return `, $${price.toFixed(2)}`;
  };

  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Preview, null, 
      `${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''} ${reviewItems.length > 1 ? 'are' : 'is'} ready whenever you are.`
    ),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        React.createElement(Section, { style: header },
          React.createElement(Text, { style: headerSubtitle },
            `${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''} ${reviewItems.length > 1 ? 'are' : 'is'} ready whenever you are.`
          )
        ),
        React.createElement(Section, { style: brandSection },
          React.createElement(Heading, { style: brandTitle }, 'Pocket Pause'),
          React.createElement(Text, { style: brandSubtitle }, 'Your paused items are ready for review.'),
          React.createElement(Text, { style: introText },
            'Here\'s what\'s been waiting for you. Take a breath and choose with clarity.'
          )
        ),
        React.createElement(Section, { style: itemsSection },
          ...reviewItems.map((item) =>
            React.createElement('div', { key: item.id, style: itemCard },
              React.createElement(Text, { style: itemText },
                React.createElement('strong', null, item.title),
                item.store_name && React.createElement('span', { style: storeText }, ` • ${item.store_name}`),
                item.price && React.createElement('span', { style: priceText }, formatPrice(item.price))
              )
            )
          )
        ),
        React.createElement(Section, { style: buttonSection },
          React.createElement(Button, { style: button, href: appUrl }, 'Review Now →')
        ),
        longPausedCount > 0 && React.createElement(Section, { style: noticeSection },
          React.createElement(Text, { style: noticeText },
            `✦ Notice: ${longPausedCount} of these items ${longPausedCount > 1 ? 'have' : 'has'} been paused for more than 10 days. ${longPausedCount > 1 ? 'Do they' : 'Does it'} still hold meaning?`
          )
        ),
        React.createElement(Section, { style: quoteSection },
          React.createElement(Text, { style: quoteText },
            'Clarity grows in pauses. Thanks for taking yours.'
          )
        ),
        React.createElement(Hr, { style: divider }),
        React.createElement(Section, { style: footer },
          React.createElement(Link, { href: appUrl, style: footerLink }, 'Manage account / settings'),
          React.createElement(Text, { style: footerSubtext }, 'Pocket-sized presence before you buy.')
        )
      )
    )
  );
};

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const headerSubtitle = {
  color: '#333',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const brandSection = {
  marginBottom: '32px',
};

const brandTitle = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textAlign: 'left' as const,
};

const brandSubtitle = {
  color: '#8B5CF6',
  fontStyle: 'italic',
  margin: '0 0 16px 0',
  fontSize: '18px',
  textAlign: 'left' as const,
};

const introText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  textAlign: 'left' as const,
};

const itemsSection = {
  margin: '32px 0',
};

const itemCard = {
  background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '8px 0',
  borderLeft: '4px solid #8B5CF6',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const itemText = {
  color: '#333',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0',
};

const storeText = {
  color: '#666',
  fontWeight: 'normal',
};

const priceText = {
  color: '#8B5CF6',
  fontWeight: '600',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  border: 'none',
};

const noticeSection = {
  background: 'linear-gradient(135deg, #fff9e6 0%, #fef3c7 100%)',
  border: '1px solid #f59e0b',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const noticeText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
  lineHeight: '1.5',
};

const quoteSection = {
  textAlign: 'center' as const,
  margin: '40px 0 24px 0',
};

const quoteText = {
  color: '#666',
  fontStyle: 'italic',
  margin: '0',
  fontSize: '18px',
  lineHeight: '1.5',
};

const divider = {
  borderColor: '#eee',
  margin: '32px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#8B5CF6',
  fontSize: '12px',
  textDecoration: 'none',
  margin: '0 0 8px 0',
  display: 'block',
};

const footerSubtext = {
  color: '#ccc',
  fontSize: '11px',
  margin: '8px 0 0 0',
};

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