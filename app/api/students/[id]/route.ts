import { NextResponse } from "next/server"
import { CLASSES_PER_GRADE } from "@/lib/domain/graduation"
import { SAFE_PROFILE_COLUMNS, isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { parseJsonBody, studentPatchSchema, uuidSchema } from "@/lib/api/validation"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
    }

    const auth = await requireAdminProfile(request)
    if (isAuthFailure(auth)) return auth.response

    const supabase = auth.supabase
    const parsed = await parseJsonBody(request, studentPatchSchema)
    if ("response" in parsed) return parsed.response

    const body = parsed.data

    const updatePayload: Record<string, string | number | boolean> = {
      updated_at: new Date().toISOString(),
    }

    if (body.full_name !== undefined) updatePayload.full_name = body.full_name
    if (body.belt !== undefined) updatePayload.belt = body.belt
    if (body.degree !== undefined) updatePayload.degree = body.degree

    if (body.belt !== undefined || body.degree !== undefined) {
      const { data: studentData } = await supabase
        .from("profiles")
        .select("belt, cycle_classes")
        .eq("id", id)
        .single()

      if (studentData) {
        const classesPerGrade = CLASSES_PER_GRADE[studentData.belt as keyof typeof CLASSES_PER_GRADE]

        if (classesPerGrade !== null && classesPerGrade !== undefined) {
          const excedente = studentData.cycle_classes - classesPerGrade
          updatePayload.cycle_classes = excedente > 0 ? excedente : 0
        } else {
          updatePayload.cycle_classes = 0
        }
      } else {
        updatePayload.cycle_classes = 0
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", id)
      .select(SAFE_PROFILE_COLUMNS)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
    }

    const auth = await requireAdminProfile(request)
    if (isAuthFailure(auth)) return auth.response

    const { error } = await auth.supabase.from("profiles").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
