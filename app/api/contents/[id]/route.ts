import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"
import { uuidSchema } from "@/lib/api/validation"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminProfile()
    if (isAuthFailure(auth)) return auth.response

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid content id" }, { status: 400 })
    }

    const { error } = await auth.supabase.from("contents").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 })
  }
}
