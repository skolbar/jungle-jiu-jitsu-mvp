import { NextResponse } from "next/server"
import { SAFE_PROFILE_COLUMNS, isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { addClassesSchema, parseJsonBody, uuidSchema } from "@/lib/api/validation"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
    }

    const auth = await requireAdminProfile(request)
    if (isAuthFailure(auth)) return auth.response

    const parsed = await parseJsonBody(request, addClassesSchema)
    if ("response" in parsed) return parsed.response

    const { quantity } = parsed.data
    const supabase = auth.supabase

    const { data: student, error: fetchError } = await supabase
      .from("profiles")
      .select("total_classes, cycle_classes")
      .eq("id", id)
      .single()

    if (fetchError || !student) {
      return NextResponse.json({ error: "Aluno nao encontrado" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        total_classes: student.total_classes + quantity,
        cycle_classes: student.cycle_classes + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SAFE_PROFILE_COLUMNS)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error adding classes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
