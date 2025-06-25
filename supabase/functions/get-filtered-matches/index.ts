import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    const { eventId, limit } = await req.json();
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    // Get current user's profile to get their gender
    const { data: userProfile, error: profileError } = await supabaseClient.from('profiles').select('gender').eq('id', user.id).single();
    if (profileError || !userProfile?.gender) {
      throw new Error('Could not retrieve user gender');
    }
    // Get user's responses to exclude people they've already responded to
    const { data: userResponses } = await supabaseClient.from('match_responses').select('target_user_id').eq('event_id', eventId).eq('user_id', user.id);
    const excludedUserIds = userResponses?.map((r)=>r.target_user_id) || [];
    excludedUserIds.push(user.id) // Exclude self
    ;
    // Get matches from the matches table, excluding already responded users
    const { data: matches } = await supabaseClient.from('matches').select(`
        user2_id,
        compatibility_score,
        profiles:user2_id (
          first_name,
          last_name,
          display_name,
          city,
          state,
          date_of_birth,
          gender,
          profile_picture_urls
        )
      `).eq('event_id', eventId).eq('user1_id', user.id).not('user2_id', 'in', `(${excludedUserIds.join(',')})`).order('compatibility_score', {
      ascending: false
    }).limit(limit || 50);
    if (!matches) {
      return new Response(JSON.stringify([]), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const filteredMatches = matches.filter((match)=>match.profiles?.gender && userProfile.gender && match.profiles.gender !== userProfile.gender);
    // Transform the data structure
    const transformedMatches = filteredMatches.map((match)=>({
        user_id: match.user2_id,
        profile: match.profiles,
        compatibility_score: match.compatibility_score || 0
      }));
    return new Response(JSON.stringify(transformedMatches), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error getting filtered matches:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
