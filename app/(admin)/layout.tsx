import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentProfile()

  if (!currentUser) redirect("/login")

  if (currentUser.profile.role !== "admin") {
    redirect("/student/home")
  }

  return <>{children}</>
}
