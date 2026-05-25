import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { createUserSchema, parseJsonBody } from "@/lib/api/validation"

export async function POST(request: Request) {
  try {
    const auth = await requireAdminProfile()
    if (isAuthFailure(auth)) return auth.response

    const parsed = await parseJsonBody(request, createUserSchema)
    if ("response" in parsed) return parsed.response

    const { full_name, email, password, belt, degree, role } = parsed.data
    const adminClient = createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        belt,
        degree,
      },
    })

    if (createError) {
      console.error("[v0] Error creating auth user:", createError)
      if (createError.message.includes("already") || createError.message.includes("exists")) {
        return NextResponse.json({ error: "Este e-mail ja esta cadastrado" }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!newUser?.user?.id) {
      return NextResponse.json({ error: "Erro ao criar usuario" }, { status: 500 })
    }

    const { error: upsertError } = await adminClient.from("profiles").upsert(
      {
        id: newUser.user.id,
        full_name,
        email,
        role,
        belt,
        degree,
        total_classes: 0,
        cycle_classes: 0,
      },
      { onConflict: "id" },
    )

    if (upsertError) {
      console.error("[v0] Error upserting profile:", upsertError)
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: "Erro ao criar perfil do usuario" }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      userId: newUser.user.id,
      message: "Usuario criado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Unexpected error creating user:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
