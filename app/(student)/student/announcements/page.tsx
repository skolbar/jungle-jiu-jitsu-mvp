"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Announcement = {
  id: string
  title: string
  message: string
  created_at: string
}

export default function StudentAnnouncementsPage() {
  const { user, isLoading } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Espera o AuthContext hidratar. O guard real fica no app/(student)/layout.tsx (server).
    if (isLoading) return
    if (!user || user.role !== "student") return

    let cancelled = false

    const fetchAnnouncements = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        if (!cancelled) setAnnouncements((data as Announcement[]) || [])
      } catch (error) {
        console.error("Error fetching announcements:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAnnouncements()

    return () => {
      cancelled = true
    }
  }, [user, isLoading])

  if (isLoading || !user || user.role !== "student" || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
          <p className="text-muted-foreground mt-1">Fique por dentro das novidades da academia</p>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="border-border border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-lg text-foreground">{announcement.title}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground">{announcement.message}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                  <Calendar className="h-4 w-4" />
                  {new Date(announcement.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
