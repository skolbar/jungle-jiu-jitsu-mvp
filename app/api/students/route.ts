import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createServerClient()

  const { data: students, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(students)
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        email: body.email,
        full_name: body.name,
        role: "student",
        belt: body.belt.toLowerCase(),
        degree: body.degree,
        total_classes: body.classCount || 0,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: body.name,
      email: body.email,
      belt: body.belt.toLowerCase(),
      degree: body.degree,
      total_classes: body.classCount,
    })
    .eq("id", body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
