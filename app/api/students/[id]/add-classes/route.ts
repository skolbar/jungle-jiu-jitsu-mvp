import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const quantity = body.quantity
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 })
    }

    const { data: student, error: fetchError } = await supabase
      .from("profiles")
      .select("total_classes, cycle_classes")
      .eq("id", id)
      .single()

    if (fetchError || !student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        total_classes: student.total_classes + quantity,
        cycle_classes: student.cycle_classes + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
