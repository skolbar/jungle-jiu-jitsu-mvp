import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Setup: Starting user creation...")

    // Create admin client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Setup: Admin client created")

    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: "admin@jungle.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        full_name: "Admin Jungle",
      },
    })

    if (adminError && !adminError.message.includes("already registered")) {
      throw new Error(`Admin user error: ${adminError.message}`)
    }

    const adminId = adminUser?.user?.id
    console.log("[v0] Setup: Admin user created/exists:", adminId)

    if (adminId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: adminId,
        email: "admin@jungle.com",
        full_name: "Admin Jungle",
        role: "admin",
        belt: "black",
        degree: 4,
        total_classes: 0,
      })

      if (profileError) console.error("[v0] Setup: Admin profile error:", profileError)
    }

    const { data: studentUser, error: studentError } = await supabase.auth.admin.createUser({
      email: "aluno@email.com",
      password: "aluno123",
      email_confirm: true,
      user_metadata: {
        full_name: "Pedro Oliveira",
      },
    })

    if (studentError && !studentError.message.includes("already registered")) {
      throw new Error(`Student user error: ${studentError.message}`)
    }

    const studentId = studentUser?.user?.id
    console.log("[v0] Setup: Student user created/exists:", studentId)

    if (studentId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: studentId,
        email: "aluno@email.com",
        full_name: "Pedro Oliveira",
        role: "student",
        belt: "white",
        degree: 3,
        total_classes: 89,
      })

      if (profileError) console.error("[v0] Setup: Student profile error:", profileError)

      // Create sample attendance for student
      await supabase.from("attendances").insert([
        { student_id: studentId, date: new Date(Date.now() - 86400000 * 1).toISOString() },
        { student_id: studentId, date: new Date(Date.now() - 86400000 * 2).toISOString() },
        { student_id: studentId, date: new Date(Date.now() - 86400000 * 3).toISOString() },
      ])
    }

    console.log("[v0] Setup: All users and data created successfully")

    return NextResponse.json({
      success: true,
      message: "Users created successfully",
      users: {
        admin: "admin@jungle.com / admin123",
        student: "aluno@email.com / aluno123",
      },
    })
  } catch (error: any) {
    console.error("[v0] Setup error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
