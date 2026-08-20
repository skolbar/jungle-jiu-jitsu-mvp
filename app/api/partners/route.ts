import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { partnerPayloadSchema, parseJsonBody } from "@/lib/api/validation"
import { PARTNER_COLUMNS } from "@/lib/domain/partners"

export async function GET(request: Request) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const { data, error } = await auth.supabase
    .from("partners")
    .select(PARTNER_COLUMNS)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, partnerPayloadSchema)
  if ("response" in parsed) return parsed.response

  const { data, error } = await auth.supabase
    .from("partners")
    .insert({ ...parsed.data, created_by: auth.user.id })
    .select(PARTNER_COLUMNS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
