import "server-only"

import { NextResponse } from "next/server"
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/domain/types"
import { SAFE_PROFILE_COLUMNS } from "@/lib/domain/profile-select"

export { SAFE_PROFILE_COLUMNS }

export interface ApiAuthContext {
  supabase: SupabaseClient
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

function getBearerToken(request?: Request): string | null {
  const authorization = request?.headers.get("authorization")
  if (!authorization) return null

  const [scheme, token] = authorization.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null

  return token.trim()
}

function createBearerClient(token: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

export async function requireAuthenticatedProfile(request?: Request): Promise<ApiAuthResult> {
  const bearerToken = getBearerToken(request)
  const supabase = bearerToken ? createBearerClient(bearerToken) : await createServerClient()

  const {
    data: { user },
    error: authError,
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser()

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

export async function requireAdminProfile(request?: Request): Promise<ApiAuthResult> {
  const auth = await requireAuthenticatedProfile(request)

  if (isAuthFailure(auth)) {
    return auth
  }

  if (auth.profile.role !== "admin") {
    return { response: jsonError("Forbidden", 403) }
  }

  return auth
}

export async function requireStudentProfile(request?: Request): Promise<ApiAuthResult> {
  const auth = await requireAuthenticatedProfile(request)

  if (isAuthFailure(auth)) {
    return auth
  }

  if (auth.profile.role !== "student") {
    return { response: jsonError("Forbidden", 403) }
  }

  return auth
}
