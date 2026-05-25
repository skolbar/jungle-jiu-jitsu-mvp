import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"
import StudentHomeClient from "./student-home-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function StudentHomePage() {
  const currentUser = await getCurrentProfile()

  if (!currentUser) redirect("/login")
  if (currentUser.profile.role !== "student") redirect("/admin/dashboard")

  return <StudentHomeClient profile={currentUser.profile} />
}
