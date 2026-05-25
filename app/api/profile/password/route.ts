import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { parseJsonBody, passwordUpdateSchema } from "@/lib/api/validation"

export async function PATCH(request: Request) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = await parseJsonBody(request, passwordUpdateSchema)
  if ("response" in parsed) return parsed.response

  const { newPassword } = parsed.data

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
