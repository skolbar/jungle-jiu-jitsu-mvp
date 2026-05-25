import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSetupRoutesEnabled } from "@/lib/setup/access"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

export async function POST() {
  if (!isSetupRoutesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const adminEmail = requiredEnv("SETUP_ADMIN_EMAIL")
    const adminPassword = requiredEnv("SETUP_ADMIN_PASSWORD")
    const studentEmail = requiredEnv("SETUP_STUDENT_EMAIL")
    const studentPassword = requiredEnv("SETUP_STUDENT_PASSWORD")

    const supabase = createAdminClient()

    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Admin Jungle",
      },
    })

    if (adminError && !adminError.message.includes("already registered")) {
      throw new Error(`Admin user error: ${adminError.message}`)
    }

    const adminId = adminUser?.user?.id

    if (adminId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: adminId,
        email: adminEmail,
        full_name: "Admin Jungle",
        role: "admin",
        belt: "black",
        degree: 4,
        total_classes: 0,
      })

      if (profileError) throw profileError
    }

    const { data: studentUser, error: studentError } = await supabase.auth.admin.createUser({
      email: studentEmail,
      password: studentPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Aluno Teste",
      },
    })

    if (studentError && !studentError.message.includes("already registered")) {
      throw new Error(`Student user error: ${studentError.message}`)
    }

    const studentId = studentUser?.user?.id

    if (studentId) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: studentId,
        email: studentEmail,
        full_name: "Aluno Teste",
        role: "student",
        belt: "white",
        degree: 0,
        total_classes: 0,
      })

      if (profileError) throw profileError
    }

    return NextResponse.json({
      success: true,
      message: "Users created successfully",
      users: {
        admin: adminEmail,
        student: studentEmail,
      },
    })
  } catch (error) {
    console.error("[v0] Setup users error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected setup error" },
      { status: 500 },
    )
  }
}
