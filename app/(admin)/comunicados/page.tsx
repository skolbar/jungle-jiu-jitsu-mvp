"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ComunicadosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAnnouncements()
    }
  }, [user])

  const fetchAnnouncements = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,message,created_by,created_at")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error("Error fetching announcements:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!title.trim() || !message.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      })

      if (!response.ok) throw new Error("Failed to send announcement")

      setTitle("")
      setMessage("")
      await fetchAnnouncements()
    } catch (error) {
      console.error("Error sending announcement:", error)
    } finally {
      setSending(false)
    }
  }

  if (isLoading || !user || loading) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
          <p className="text-muted-foreground mt-1">Envie mensagens para todos os alunos</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Send className="h-5 w-5 text-primary" />
              Novo Comunicado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Título do comunicado..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={sending || !title.trim() || !message.trim()}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Enviando..." : "Enviar para Todos"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="h-5 w-5" />
              Histórico de Comunicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{announcement.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(announcement.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{announcement.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
