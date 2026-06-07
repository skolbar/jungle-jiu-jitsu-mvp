import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { announcementCreateSchema, parseJsonBody } from "@/lib/api/validation"

const ANNOUNCEMENT_COLUMNS = "id,title,message,created_by,created_at"

export async function GET(request: Request) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const { data: announcements, error } = await auth.supabase
    .from("announcements")
    .select(ANNOUNCEMENT_COLUMNS)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(announcements)
}

export async function POST(request: Request) {
  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, announcementCreateSchema)
  if ("response" in parsed) return parsed.response

  const { title, message } = parsed.data

  const { data, error } = await auth.supabase
    .from("announcements")
    .insert([
      {
        title,
        message,
        created_by: auth.user.id,
      },
    ])
    .select(ANNOUNCEMENT_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
