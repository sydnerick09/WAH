// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// supabase is null when env vars are not yet configured, app falls back to localStorage
export const supabase    = url && key ? createClient(url, key) : null;
export const hasSupabase = Boolean(supabase);
