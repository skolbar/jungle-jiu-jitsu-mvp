import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { createAttendanceSchema, parseJsonBody, uuidSchema } from "@/lib/api/validation"

export async function GET(request: Request) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const supabase = auth.supabase
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

  if (studentId && !uuidSchema.safeParse(studentId).success) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
  }

  let query = supabase
    .from("attendances")
    .select(`
      id,
      student_id,
      date,
      created_at,
      student:student_id (
        id,
        full_name,
        belt,
        degree
      )
    `)
    .order("date", { ascending: false })

  if (auth.profile.role === "admin" && studentId) {
    query = query.eq("student_id", studentId)
  } else if (auth.profile.role === "student") {
    if (studentId && studentId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    query = query.eq("student_id", auth.user.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const supabase = auth.supabase
  const parsed = await parseJsonBody(request, createAttendanceSchema)
  if ("response" in parsed) return parsed.response

  const { studentId, date } = parsed.data

  const { data, error } = await supabase
    .from("attendances")
    .insert([
      {
        student_id: studentId,
        date: date || new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("total_classes, cycle_classes")
    .eq("id", studentId)
    .single()

  if (!profileError && profile) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        total_classes: (profile.total_classes || 0) + 1,
        cycle_classes: (profile.cycle_classes || 0) + 1,
      })
      .eq("id", studentId)

    if (updateError) {
      console.error("Failed to increment attendance counters:", updateError)
    }
  }

  return NextResponse.json(data)
}
