import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

type BulkStatus = "approved" | "rejected"

export async function PATCH(request: Request) {
  const supabase = await createServerClient()

  // Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Confirma role admin no banco
  const { data: meProfile, error: meProfileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (meProfileError || !meProfile || meProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Body
  const body = await request.json().catch(() => ({} as any))
  const status = body?.status as BulkStatus

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: 'Invalid status. Use "approved" or "rejected".' }, { status: 400 })
  }

  // Busca pendentes (ids + student_id)
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

  const ids = pending.map((p) => p.id)
  const nowIso = new Date().toISOString()

  // Atualiza todos os pendentes
  const { error: updateError } = await supabase
    .from("check_ins")
    .update({
      status,
      validated_at: nowIso,
      validated_by: user.id,
    })
    .in("id", ids)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Se aprovou, replica a lógica do PATCH unitário:
  // - cria attendance
  // - incrementa total_classes e cycle_classes
  if (status === "approved") {
    // Faz em loop para manter compatibilidade com seu schema atual
    for (const item of pending) {
      // Attendance
      await supabase.from("attendances").insert([
        {
          student_id: item.student_id,
          date: nowIso,
        },
      ])

      // Counters
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_classes, cycle_classes")
        .eq("id", item.student_id)
        .single()

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            total_classes: (profile.total_classes || 0) + 1,
            cycle_classes: (profile.cycle_classes || 0) + 1,
          })
          .eq("id", item.student_id)
      }
    }
  }

  return NextResponse.json({ updated: ids.length }, { status: 200 })
}
