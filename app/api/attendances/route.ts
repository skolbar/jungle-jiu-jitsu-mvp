import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")

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

  if (studentId) {
    query = query.eq("student_id", studentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("attendances")
    .insert([
      {
        student_id: body.studentId,
        date: body.date || new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: updateError } = await supabase.rpc("increment_total_classes", {
    student_uuid: body.studentId,
  })

  if (updateError) {
    console.error("Failed to increment total_classes:", updateError)
  }

  // Increment cycle_classes
  const { error: cycleError } = await supabase
    .from("profiles")
    .update({ cycle_classes: supabase.raw("cycle_classes + 1") })
    .eq("id", body.studentId)

  if (cycleError) {
    console.error("Failed to increment cycle_classes:", cycleError)
  }

  return NextResponse.json(data)
}
