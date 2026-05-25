import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_BELTS = ["white", "blue", "purple", "brown", "black"] as const

type AllowedBelt = (typeof ALLOWED_BELTS)[number]

export async function PATCH(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Lê profile atual (pra validar role e lock)
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, belt_locked")
    .eq("id", user.id)
    .single()

  if (profileError || !currentProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  if (currentProfile.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (currentProfile.belt_locked === true) {
    return NextResponse.json(
      { error: "Belt and degree are already locked for this user" },
      { status: 409 },
    )
  }

  const body = await request.json()
  const belt = body?.belt as AllowedBelt | undefined
  const degree = body?.degree as number | undefined

  if (!belt || !ALLOWED_BELTS.includes(belt)) {
    return NextResponse.json(
      { error: "Invalid belt. Allowed: white/blue/purple/brown/black" },
      { status: 400 },
    )
  }

  if (typeof degree !== "number" || !Number.isInteger(degree) || degree < 0 || degree > 4) {
    return NextResponse.json(
      { error: "Invalid degree. Must be an integer from 0 to 4" },
      { status: 400 },
    )
  }

  // Update atômico: só atualiza se belt_locked ainda for false
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({
      belt,
      degree,
      belt_locked: true,
    })
    .eq("id", user.id)
    .eq("belt_locked", false)
    .select("*")
    .single()

  // Se não atualizou porque já estava locked (corrida), tratamos
  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Belt and degree are already locked for this user" },
      { status: 409 },
    )
  }

  return NextResponse.json(updated, { status: 200 })
}
