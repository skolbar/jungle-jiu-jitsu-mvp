import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    // 1. Verify request is from an authenticated admin
    const supabase = await createServerClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem criar usuários." },
        { status: 403 },
      )
    }

    // 2. Parse body
    const body = await request.json()
    const { full_name, email, password, belt, degree, role = "student" } = body

    // Validate required fields
    if (!full_name || !email || !password || !belt) {
      return NextResponse.json({ error: "Campos obrigatórios: nome, email, senha, faixa" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Validate degree range
    const degreeInt = Math.max(0, Math.min(4, Number(degree) || 0))

    // 3. Create auth user using admin client (server-side only)
    const adminClient = createAdminClient()

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        belt,
        degree: degreeInt,
      },
    })

    if (createError) {
      console.error("[v0] Error creating auth user:", createError)
      if (createError.message.includes("already") || createError.message.includes("exists")) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!newUser?.user?.id) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    // 4. Upsert into profiles
    const { error: upsertError } = await adminClient.from("profiles").upsert(
      {
        id: newUser.user.id,
        full_name,
        email,
        role,
        belt,
        degree: degreeInt,
        total_classes: 0,
        cycle_classes: 0,
      },
      { onConflict: "id" },
    )

    if (upsertError) {
      console.error("[v0] Error upserting profile:", upsertError)
      // User was created in auth but profile failed - try to delete auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: "Erro ao criar perfil do usuário" }, { status: 500 })
    }

    // 5. Return success
    return NextResponse.json({
      ok: true,
      userId: newUser.user.id,
      message: "Usuário criado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Unexpected error creating user:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
