"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function logoutAction() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  return { ok: true }
}
