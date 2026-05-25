"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function loginAction(email: string, password: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  // IMPORTANT:
  // Do NOT redirect here. Let the client navigate after receiving ok=true.
  // The server action will set the auth cookies via @supabase/ssr cookie adapter.
  return { ok: true, userId: data.user?.id ?? null }
}
