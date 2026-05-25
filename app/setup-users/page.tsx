import { notFound } from "next/navigation"
import { isSetupRoutesEnabled } from "@/lib/setup/access"
import { SetupUsersClient } from "./setup-users-client"

export default function SetupUsersPage() {
  if (!isSetupRoutesEnabled()) {
    notFound()
  }

  return <SetupUsersClient />
}
