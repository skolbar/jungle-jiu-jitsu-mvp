import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { partnerPayloadSchema, parseJsonBody, uuidSchema } from "@/lib/api/validation"
import { PARTNER_COLUMNS } from "@/lib/domain/partners"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid partner id" }, { status: 400 })

  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, partnerPayloadSchema)
  if ("response" in parsed) return parsed.response

  const { data, error } = await auth.supabase
    .from("partners")
    .update(parsed.data)
    .eq("id", id)
    .select(PARTNER_COLUMNS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid partner id" }, { status: 400 })

  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const { error } = await auth.supabase.from("partners").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
