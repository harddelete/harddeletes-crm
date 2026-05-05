import { isSupabaseConfigured, supabase } from "./supabaseClient";

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Hiányoznak a Supabase környezeti változók. Állítsd be a .env.local fájlt.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error: error?.message ?? null };
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Hiányoznak a Supabase környezeti változók. Állítsd be a .env.local fájlt.",
      needsEmailConfirmation: false,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    error: error?.message ?? null,
    needsEmailConfirmation: !data.session,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
