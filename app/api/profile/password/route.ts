import { NextResponse } from "next/server"
import { isAuthFailure, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { parseJsonBody, passwordUpdateSchema } from "@/lib/api/validation"

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, passwordUpdateSchema)
  if ("response" in parsed) return parsed.response

  const { newPassword } = parsed.data

  const { error } = await auth.supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
