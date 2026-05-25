import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { CLASSES_PER_GRADE } from "@/lib/domain/graduation"

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

    const updatePayload: Record<string, any> = {
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
      .select()
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
    const supabase = await createServerClient()

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

    const { error } = await supabase.from("profiles").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
