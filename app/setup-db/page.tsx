"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function runSetup() {
    setStatus("loading")
    setMessage("Configurando banco de dados...")

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Configuração concluída com sucesso!")
      } else {
        setStatus("error")
        setMessage(data.error || "Erro ao configurar")
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(error.message || "Erro de conexão")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuração do Banco de Dados</CardTitle>
          <CardDescription>Execute a configuração inicial do Supabase para criar usuários e dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "idle" && (
            <Button onClick={runSetup} className="w-full">
              Executar Setup
            </Button>
          )}

          {status === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{message}</span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{message}</span>
              </div>
              <div className="text-sm space-y-2 bg-muted p-4 rounded-lg">
                <p className="font-medium">Credenciais de acesso:</p>
                <p>
                  <strong>Admin:</strong> admin@jungle.com / admin123
                </p>
                <p>
                  <strong>Aluno:</strong> aluno@email.com / aluno123
                </p>
              </div>
              <Button onClick={() => (window.location.href = "/login")} className="w-full">
                Ir para Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">{message}</span>
              </div>
              <Button onClick={runSetup} variant="outline" className="w-full bg-transparent">
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
