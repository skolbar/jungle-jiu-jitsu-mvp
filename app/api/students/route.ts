import { NextResponse } from "next/server"
import { SAFE_PROFILE_COLUMNS, isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { legacyStudentCreateSchema, legacyStudentUpdateSchema, parseJsonBody } from "@/lib/api/validation"

export async function GET() {
  const auth = await requireAdminProfile()
  if (isAuthFailure(auth)) return auth.response

  const { data: students, error } = await auth.supabase
    .from("profiles")
    .select(SAFE_PROFILE_COLUMNS)
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(students)
}

export async function POST(request: Request) {
  const auth = await requireAdminProfile()
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, legacyStudentCreateSchema)
  if ("response" in parsed) return parsed.response

  const body = parsed.data

  const { data, error } = await auth.supabase
    .from("profiles")
    .insert([
      {
        email: body.email,
        full_name: body.name,
        role: "student",
        belt: body.belt,
        degree: body.degree,
        total_classes: body.classCount,
      },
    ])
    .select(SAFE_PROFILE_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const auth = await requireAdminProfile()
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, legacyStudentUpdateSchema)
  if ("response" in parsed) return parsed.response

  const body = parsed.data

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({
      full_name: body.name,
      email: body.email,
      belt: body.belt,
      degree: body.degree,
      total_classes: body.classCount,
    })
    .eq("id", body.id)
    .select(SAFE_PROFILE_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
