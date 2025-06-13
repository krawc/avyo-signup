
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

    const { eventId, userId } = await req.json()

    // Get user's profile
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!userProfile) {
      throw new Error('User profile not found')
    }

    // Get all attendees of the event (excluding the current user)
    const { data: attendees } = await supabaseClient
      .from('event_attendees')
      .select(`
        user_id,
        profiles (*)
      `)
      .eq('event_id', eventId)
      .neq('user_id', userId)

    if (!attendees) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate compatibility scores
    const potentialMatches = attendees
      .filter(attendee => attendee.profiles)
      .map(attendee => {
        const profile = attendee.profiles
        let score = 0

        // Age compatibility (higher score for closer ages)
        if (userProfile.date_of_birth && profile.date_of_birth) {
          const userAge = Math.floor((Date.now() - new Date(userProfile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          const profileAge = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          const ageDiff = Math.abs(userAge - profileAge)
          
          if (ageDiff <= 2) score += 30
          else if (ageDiff <= 5) score += 20
          else if (ageDiff <= 10) score += 10
        }

        // Gender preference (basic implementation)
        if (userProfile.gender && profile.gender && userProfile.gender !== profile.gender) {
          score += 20
        }

        // Same city bonus
        if (userProfile.city && profile.city && userProfile.city === profile.city) {
          score += 25
        }

        // Same state bonus
        if (userProfile.state && profile.state && userProfile.state === profile.state) {
          score += 15
        }

        // Marital status compatibility
        if (userProfile.marital_status && profile.marital_status) {
          if (userProfile.marital_status === profile.marital_status) {
            score += 15
          }
        }

        // Kids compatibility
        if (userProfile.has_kids && profile.has_kids) {
          if (userProfile.has_kids === profile.has_kids) {
            score += 10
          }
        }

        return {
          user_id: attendee.user_id,
          profile,
          compatibility_score: score
        }
      })
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 5) // Top 5 matches

    // Store matches in database
    const matchesToInsert = potentialMatches.map(match => ({
      event_id: eventId,
      user1_id: userId,
      user2_id: match.user_id,
      compatibility_score: match.compatibility_score
    }))

    if (matchesToInsert.length > 0) {
      await supabaseClient
        .from('matches')
        .upsert(matchesToInsert, { 
          onConflict: 'event_id,user1_id,user2_id',
          ignoreDuplicates: false 
        })
    }

    return new Response(JSON.stringify(potentialMatches), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
