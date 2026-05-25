import { NextResponse } from "next/server"
import { isSetupRoutesEnabled } from "@/lib/setup/access"

export async function POST() {
  if (!isSetupRoutesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(
    {
      error:
        "Database setup by public endpoint is disabled. Use reviewed migrations or /api/setup-users in a controlled environment.",
    },
    { status: 403 },
  )
}
