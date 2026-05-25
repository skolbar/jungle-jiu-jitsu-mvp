// app/auth/post-login/page.tsx
import { redirect } from "next/navigation"
import { getCurrentProfile } from "@/lib/auth/get-current-profile"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PostLoginPage() {
  const currentUser = await getCurrentProfile()

  if (!currentUser) {
    redirect("/login")
  }

  if (currentUser.profile.role === "admin") {
    redirect("/dashboard")
  }

  redirect("/student/home")

}
