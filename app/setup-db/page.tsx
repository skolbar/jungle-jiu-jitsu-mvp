import { notFound } from "next/navigation"
import { isSetupRoutesEnabled } from "@/lib/setup/access"
import { SetupDbClient } from "./setup-db-client"

export default function SetupPage() {
  if (!isSetupRoutesEnabled()) {
    notFound()
  }

  return <SetupDbClient />
}
