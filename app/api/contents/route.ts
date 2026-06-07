import { NextResponse, type NextRequest } from "next/server"
import { isAuthFailure, requireAdminProfile, requireAuthenticatedProfile } from "@/lib/auth/api-auth"
import { contentCreateSchema, parseJsonBody } from "@/lib/api/validation"

const CONTENT_COLUMNS = "id,title,description,type,url,required_belt,required_degree,module_slug,category,created_at"

export async function GET(request: NextRequest) {
  const auth = await requireAuthenticatedProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const searchParams = request.nextUrl.searchParams
  const moduleSlug = searchParams.get("module_slug")

  let query = auth.supabase.from("contents").select(CONTENT_COLUMNS).order("created_at", { ascending: false })

  if (moduleSlug) {
    query = query.eq("module_slug", moduleSlug)
  }

  const { data: contents, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(contents)
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminProfile(request)
    if (isAuthFailure(auth)) return auth.response

    const parsed = await parseJsonBody(request, contentCreateSchema)
    if ("response" in parsed) return parsed.response

    const body = parsed.data

    const { data, error } = await auth.supabase
      .from("contents")
      .insert({
        title: body.title,
        description: body.description,
        type: body.type,
        url: body.url,
        required_belt: body.required_belt,
        required_degree: body.required_degree,
        module_slug: body.module_slug,
        category: body.category,
      })
      .select(CONTENT_COLUMNS)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}
