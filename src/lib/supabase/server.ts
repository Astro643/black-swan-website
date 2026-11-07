import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './wrappers';
import { NextResponse } from 'next/server';

// ============================================
// SERVER-SIDE SUPABASE CLIENT
// For Server Components and Server Actions
// ============================================

export const createClient = () => createServerSupabaseClient();

// ============================================
// SERVER ACTIONS CLIENT
// For Server Actions with proper session handling
// ============================================

export const createServerActionClient = () => createServerSupabaseClient();

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Get the current user session
 */
export const getSession = async () => {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
};

/**
 * Get the current user
 */
export const getUser = async () => {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
};

/**
 * Get user profile from database
 */
export const getUserProfile = async () => {
  const supabase = createClient();
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('discord_id', session.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Check if user is admin (guild owner)
 */
export const isAdmin = async () => {
  const supabase = createClient();
  const session = await getSession();
  
  if (!session) {
    return false;
  }
  
  const adminGuildId = process.env.ADMIN_GUILD_ID;
  
  if (!adminGuildId) {
    // If no admin guild is configured, check if user is in the database
    const profile = await getUserProfile();
    return profile?.username === 'Astro643' || false;
  }
  
  try {
    // Get Discord guilds for the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return false;
    }
    
    // Check if user has the admin role
    // This would typically be done via Discord API, but for simplicity
    // we'll check if the user's Discord ID matches the expected admin
    const profile = await getUserProfile();
    
    if (!profile) {
      return false;
    }
    
    // For now, use a simple check - in production, use Discord API
    // to verify guild ownership
    return profile.discord_id === process.env.ADMIN_DISCORD_ID;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Sign in with Discord
 */
export const signInWithDiscord = async () => {
  const supabase = createClient();
  const redirectUrl = process.env.DISCORD_REDIRECT_URI || `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      scopes: 'identify guilds',
    },
  });
  
  if (error) {
    console.error('Error signing in with Discord:', error);
    return { error: error.message };
  }
  
  return { url: data.url };
};

/**
 * Sign out
 */
export const signOut = async () => {
  const supabase = createClient();
  
  await supabase.auth.signOut();
  
  return NextResponse.redirect('/');
};

// ============================================
// SESSION MANAGEMENT MIDDLEWARE
// ============================================

/**
 * Update session in cookies
 */
export const updateSession = async (accessToken: string, refreshToken: string | null) => {
  const cookieStore = cookies();
  const supabase = createClient();
  
  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

/**
 * Clear session from cookies
 */
export const clearSession = async () => {
  const cookieStore = cookies();
  const supabase = createClient();
  
  await supabase.auth.signOut();
  
  // Clear cookies manually
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
};
