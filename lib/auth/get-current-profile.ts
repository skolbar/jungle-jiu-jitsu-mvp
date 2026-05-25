import "server-only"

/**
 * SINGLE SOURCE OF TRUTH for server-side auth
 * This function is called ONCE per request in layouts
 * No other server/client code should duplicate this validation
 */
import { createServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/domain/types"
import { SAFE_PROFILE_COLUMNS } from "@/lib/auth/api-auth"

export interface CurrentUser {
  userId: string
  profile: Profile
}

export async function getCurrentProfile(): Promise<CurrentUser | null> {
  const supabase = await createServerClient()

  // Single auth check per request
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Single profile fetch per request
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(SAFE_PROFILE_COLUMNS)
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return null
  }

  return {
    userId: user.id,
    profile: profile as Profile,
  }
}
