import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { planType } = await req.json();
    logStep("Request received", { planType });

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Define pricing based on plan type
    let lineItems;
    let planName = "Pause Plus";
    
    switch (planType) {
      case "monthly":
        lineItems = [{
          price_data: {
            currency: "usd",
            product_data: { 
              name: planName,
              description: "Monthly Pause Plus subscription with premium features"
            },
            unit_amount: 299, // $2.99 in cents
            recurring: { interval: "month" },
          },
          quantity: 1,
        }];
        break;
      case "seasonal":
        lineItems = [{
          price_data: {
            currency: "usd",
            product_data: { 
              name: planName,
              description: "Seasonal Pause Plus subscription (3 months) with premium features"
            },
            unit_amount: 600, // $6.00 in cents
            recurring: { interval: "month", interval_count: 3 },
          },
          quantity: 1,
        }];
        break;
      case "yearly":
        lineItems = [{
          price_data: {
            currency: "usd",
            product_data: { 
              name: planName,
              description: "Annual Pause Plus subscription with premium features"
            },
            unit_amount: 2000, // $20.00 in cents
            recurring: { interval: "year" },
          },
          quantity: 1,
        }];
        break;
      default:
        throw new Error("Invalid plan type");
    }

    logStep("Creating checkout session", { planType, lineItems });

    // Create a subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        plan_type: planType
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});