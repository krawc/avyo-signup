
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseService.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid" && session.metadata) {
      const { eventId, userId, isPostEvent } = session.metadata;
      
      if (userId !== user.id) {
        throw new Error("Session user mismatch");
      }

      // Check if user is already an attendee
      const { data: existingAttendee } = await supabaseService
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      // If not already an attendee, add them
      if (!existingAttendee) {
        await supabaseService
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: userId
          });
      }

      // Record the payment access
      const accessExpiresAt = isPostEvent === 'true' 
        ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
        : null; // Regular payments don't expire

      await supabaseService
        .from('event_payments')
        .upsert({
          user_id: userId,
          event_id: eventId,
          stripe_session_id: sessionId,
          amount: session.amount_total,
          currency: session.currency,
          status: 'paid',
          is_post_event: isPostEvent === 'true',
          access_expires_at: accessExpiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,event_id' });

      return new Response(JSON.stringify({ 
        success: true, 
        hasAccess: true,
        isPostEvent: isPostEvent === 'true'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      hasAccess: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
