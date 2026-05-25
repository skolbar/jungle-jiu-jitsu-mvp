import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile, requireAuthenticatedProfile, requireStudentProfile } from "@/lib/auth/api-auth"
import { checkInDecisionSchema, parseJsonBody } from "@/lib/api/validation"

export async function GET() {
  const auth = await requireAuthenticatedProfile()
  if (isAuthFailure(auth)) return auth.response

  let query = auth.supabase
    .from("check_ins")
    .select(`
      id,
      status,
      created_at,
      validated_at,
      student:student_id (
        id,
        full_name,
        belt,
        degree,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (auth.profile.role !== "admin") {
    query = query.eq("student_id", auth.user.id)
  }

  const { data: checkIns, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(checkIns)
}

export async function POST(request: Request) {
  const auth = await requireStudentProfile()
  if (isAuthFailure(auth)) return auth.response

  const supabase = auth.supabase

  const { data, error } = await supabase
    .from("check_ins")
    .insert([
      {
        student_id: auth.user.id,
        status: "pending",
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const auth = await requireAdminProfile()
  if (isAuthFailure(auth)) return auth.response

  const supabase = auth.supabase
  const parsed = await parseJsonBody(request, checkInDecisionSchema)
  if ("response" in parsed) return parsed.response

  const { id, status } = parsed.data

  const updateData = {
    status,
    validated_at: new Date().toISOString(),
    validated_by: auth.user.id,
  }

  const { data, error } = await supabase
    .from("check_ins")
    .update(updateData)
    .eq("id", id)
    .eq("status", "pending")
    .select("id,status,student_id,created_at,validated_at,validated_by")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Check-in not found or already processed" }, { status: 409 })
  }

  // If approved, create attendance and increment counters
  if (status === "approved") {
    const { error: attendanceError } = await supabase.from("attendances").insert([
      {
        student_id: data.student_id,
        date: new Date().toISOString(),
      },
    ])

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_classes, cycle_classes")
      .eq("id", data.student_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found for check-in" }, { status: 500 })
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        total_classes: (profile.total_classes || 0) + 1,
        cycle_classes: (profile.cycle_classes || 0) + 1,
      })
      .eq("id", data.student_id)

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message }, { status: 500 })
    }
  }

  return NextResponse.json(data)
}
