import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = await createServerClient()

  // Autenticação REAL (valida no Auth server)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // Profile do seu banco
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    // Usuário existe mas profile não -> trata como não autorizado pro app
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // IMPORTANTE: devolver em "user" porque seu AuthContext lê json.user
  return NextResponse.json({ user: profile }, { status: 200 })
}
