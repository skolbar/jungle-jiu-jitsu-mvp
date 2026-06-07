import { NextResponse } from "next/server"
import { SAFE_PROFILE_COLUMNS, isAuthFailure, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { parseJsonBody, profileUpdateSchema } from "@/lib/api/validation"

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, profileUpdateSchema)
  if ("response" in parsed) return parsed.response

  const { full_name, avatar_url } = parsed.data

  const updateData: Record<string, string | null> = {}
  if (full_name !== undefined) updateData.full_name = full_name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(updateData)
    .eq("id", auth.user.id)
    .select(SAFE_PROFILE_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
