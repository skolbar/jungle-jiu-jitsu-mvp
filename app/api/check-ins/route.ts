import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerClient()

  const { data: checkIns, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(checkIns)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("check_ins")
    .insert([
      {
        student_id: user.id,
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
  const supabase = await createServerClient()
  const body = await request.json()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updateData: any = {
    status: body.status,
    validated_at: new Date().toISOString(),
    validated_by: user.id,
  }

  const { data, error } = await supabase.from("check_ins").update(updateData).eq("id", body.id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If approved, create attendance and increment counters
  if (body.status === "approved") {
    const { data: checkIn } = await supabase.from("check_ins").select("student_id").eq("id", body.id).single()

    if (checkIn) {
      // Create attendance record
      await supabase.from("attendances").insert([
        {
          student_id: checkIn.student_id,
          date: new Date().toISOString(),
        },
      ])

      const { data: profile } = await supabase
        .from("profiles")
        .select("total_classes, cycle_classes")
        .eq("id", checkIn.student_id)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            total_classes: (profile.total_classes || 0) + 1,
            cycle_classes: (profile.cycle_classes || 0) + 1,
          })
          .eq("id", checkIn.student_id)
      }
    }
  }

  return NextResponse.json(data)
}
