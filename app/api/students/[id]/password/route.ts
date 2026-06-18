import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { parseJsonBody, studentPasswordResetSchema, uuidSchema } from "@/lib/api/validation"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid student id" }, { status: 400 })
    }

    const auth = await requireAdminProfile(request)
    if (isAuthFailure(auth)) return auth.response

    const parsed = await parseJsonBody(request, studentPasswordResetSchema)
    if ("response" in parsed) return parsed.response

    const { data: student, error: studentError } = await auth.supabase
      .from("profiles")
      .select("id, role, email")
      .eq("id", id)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "Aluno nao encontrado" }, { status: 404 })
    }

    if (student.role !== "student") {
      return NextResponse.json({ error: "Apenas senhas de alunos podem ser redefinidas por esta rota" }, { status: 403 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(id, {
      password: parsed.data.newPassword,
    })

    if (error) {
      console.error("[v0] Error resetting student password:", error)
      return NextResponse.json({ error: "Nao foi possivel redefinir a senha do aluno" }, { status: 500 })
    }

    return NextResponse.json({ success: true, email: student.email })
  } catch (error) {
    console.error("[v0] Unexpected error resetting student password:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
