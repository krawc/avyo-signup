
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { eventId, targetUserId, response } = await req.json()

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Insert or update the match response
    const { error: responseError } = await supabaseClient
      .from('match_responses')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        target_user_id: targetUserId,
        response: response
      }, {
        onConflict: 'event_id,user_id,target_user_id'
      })

    if (responseError) {
      throw responseError
    }

    // Check if this creates a mutual match
    let isMutualMatch = false
    if (response === 'yes') {
      const { data: mutualMatch } = await supabaseClient
        .from('match_responses')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .eq('target_user_id', user.id)
        .eq('response', 'yes')
        .maybeSingle()

      if (mutualMatch) {
        isMutualMatch = true

        // Create a connection for mutual matches
        const { error: connectionError } = await supabaseClient
          .from('connections')
          .upsert({
            requester_id: user.id,
            addressee_id: targetUserId,
            status: 'accepted'
          }, {
            onConflict: 'requester_id,addressee_id'
          })

        if (connectionError) {
          console.error('Error creating connection:', connectionError)
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      isMutualMatch,
      targetUserId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error handling match response:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
