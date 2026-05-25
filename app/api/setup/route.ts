import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create admin user
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: "admin@jungle.com",
      password: "admin123",
      email_confirm: true,
    })

    if (adminAuthError && !adminAuthError.message.includes("already been registered")) {
      throw new Error(`Admin auth error: ${adminAuthError.message}`)
    }

    const adminId = adminAuth?.user?.id

    if (adminId) {
      await supabase.from("profiles").upsert({
        id: adminId,
        role: "admin",
        full_name: "Admin Jungle",
        email: "admin@jungle.com",
        belt: "BLACK",
        grade: 4,
        total_classes: 0,
      })
    }

    // Create student user
    const { data: studentAuth, error: studentAuthError } = await supabase.auth.admin.createUser({
      email: "aluno@email.com",
      password: "aluno123",
      email_confirm: true,
    })

    if (studentAuthError && !studentAuthError.message.includes("already been registered")) {
      throw new Error(`Student auth error: ${studentAuthError.message}`)
    }

    const studentId = studentAuth?.user?.id

    if (studentId) {
      await supabase.from("profiles").upsert({
        id: studentId,
        role: "student",
        full_name: "Pedro Oliveira",
        email: "aluno@email.com",
        belt: "WHITE",
        grade: 3,
        total_classes: 89,
      })
    }

    // Seed content
    if (adminId) {
      await supabase.from("contents").upsert(
        [
          {
            id: "00000000-0000-0000-0000-000000000001",
            title: "Fundamentos do Jiu-Jitsu",
            description: "Aprenda as posições básicas",
            content_url: "/content/fundamentos.mp4",
            min_belt: "WHITE",
            created_by: adminId,
          },
          {
            id: "00000000-0000-0000-0000-000000000002",
            title: "Raspagens Avançadas",
            description: "Técnicas de raspagem",
            content_url: "/content/raspagens.mp4",
            min_belt: "BLUE",
            created_by: adminId,
          },
        ],
        { onConflict: "id" },
      )

      await supabase.from("announcements").insert({
        title: "Bem-vindo ao Sistema Jungle!",
        body: "O sistema está pronto para uso!",
        created_by: adminId,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      credentials: {
        admin: "admin@jungle.com / admin123",
        student: "aluno@email.com / aluno123",
      },
    })
  } catch (error: any) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: error.message || "Setup failed" }, { status: 500 })
  }
}
