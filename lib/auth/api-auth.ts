import "server-only"

import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/domain/types"
import { SAFE_PROFILE_COLUMNS } from "@/lib/domain/profile-select"

export { SAFE_PROFILE_COLUMNS }

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

export interface ApiAuthContext {
  supabase: SupabaseServerClient
  user: User
  profile: Profile
}

export interface ApiAuthFailure {
  response: NextResponse
}

export type ApiAuthResult = ApiAuthContext | ApiAuthFailure

export function isAuthFailure(result: ApiAuthResult): result is ApiAuthFailure {
  return "response" in result
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireAuthenticatedProfile(): Promise<ApiAuthResult> {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { response: jsonError("Unauthorized", 401) }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(SAFE_PROFILE_COLUMNS)
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return { response: jsonError("Unauthorized", 401) }
  }

  return {
    supabase,
    user,
    profile: profile as Profile,
  }
}

export async function requireAdminProfile(): Promise<ApiAuthResult> {
  const auth = await requireAuthenticatedProfile()

  if (isAuthFailure(auth)) {
    return auth
  }

  if (auth.profile.role !== "admin") {
    return { response: jsonError("Forbidden", 403) }
  }

  return auth
}

export async function requireStudentProfile(): Promise<ApiAuthResult> {
  const auth = await requireAuthenticatedProfile()

  if (isAuthFailure(auth)) {
    return auth
  }

  if (auth.profile.role !== "student") {
    return { response: jsonError("Forbidden", 403) }
  }

  return auth
}
