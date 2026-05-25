import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { bulkCheckInDecisionSchema, parseJsonBody } from "@/lib/api/validation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(request: Request) {
  const auth = await requireAdminProfile()
  if (isAuthFailure(auth)) return auth.response

  const parsed = await parseJsonBody(request, bulkCheckInDecisionSchema)
  if ("response" in parsed) return parsed.response

  const { status } = parsed.data
  const supabase = auth.supabase

  const { data: pending, error: pendingError } = await supabase
    .from("check_ins")
    .select("id, student_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ updated: 0 }, { status: 200 })
  }

  const nowIso = new Date().toISOString()

  if (status === "rejected") {
    const { error: updateError } = await supabase
      .from("check_ins")
      .update({
        status,
        validated_at: nowIso,
        validated_by: auth.user.id,
      })
      .in(
        "id",
        pending.map((item) => item.id),
      )
      .eq("status", "pending")

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ updated: pending.length }, { status: 200 })
  }

  let updated = 0

  for (const item of pending) {
    const { data: checkIn, error: updateError } = await supabase
      .from("check_ins")
      .update({
        status: "approved",
        validated_at: nowIso,
        validated_by: auth.user.id,
      })
      .eq("id", item.id)
      .eq("status", "pending")
      .select("id, student_id")
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ error: updateError.message, updated }, { status: 500 })
    }

    if (!checkIn) {
      continue
    }

    const { error: attendanceError } = await supabase.from("attendances").insert([
      {
        student_id: checkIn.student_id,
        date: nowIso,
      },
    ])

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message, updated }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_classes, cycle_classes")
      .eq("id", checkIn.student_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found for check-in", updated }, { status: 500 })
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        total_classes: (profile.total_classes || 0) + 1,
        cycle_classes: (profile.cycle_classes || 0) + 1,
      })
      .eq("id", checkIn.student_id)

    if (updateProfileError) {
      return NextResponse.json({ error: updateProfileError.message, updated }, { status: 500 })
    }

    updated += 1
  }

  return NextResponse.json({ updated }, { status: 200 })
}
