import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { full_name, avatar_url } = body

  const updateData: Record<string, string> = {}
  if (full_name !== undefined) updateData.full_name = full_name
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  const { data, error } = await supabase.from("profiles").update(updateData).eq("id", user.id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
