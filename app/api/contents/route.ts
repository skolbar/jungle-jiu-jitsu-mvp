import { createServerClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const searchParams = request.nextUrl.searchParams
  const moduleSlug = searchParams.get("module_slug")

  let query = supabase.from("contents").select("*").order("created_at", { ascending: false })

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
    const supabase = await createServerClient()
    const body = await request.json()

    const { data, error } = await supabase
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
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create content" }, { status: 500 })
  }
}
