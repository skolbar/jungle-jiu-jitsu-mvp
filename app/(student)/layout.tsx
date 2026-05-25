import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Server-side guard (fonte de verdade)
 * - Se não estiver logado -> /login
 * - Se não for student -> redireciona para /dashboard
 *
 * Isso evita "logout fantasma" ao navegar no published.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentProfile()

  if (!currentUser) {
    redirect("/login")
  }

  if (currentUser.profile.role !== "student") {
    redirect("/dashboard")
  }

  return <>{children}</>
}
