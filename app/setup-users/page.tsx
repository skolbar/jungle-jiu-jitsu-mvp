"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SetupUsersPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const handleSetup = async () => {
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/setup-users", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to create users")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Setup Usuários de Teste</h1>

        <p className="text-sm text-muted-foreground text-center">
          Clique no botão abaixo para criar os usuários de teste no Supabase Auth.
        </p>

        <Button onClick={handleSetup} disabled={loading} className="w-full">
          {loading ? "Criando usuários..." : "Criar Usuários"}
        </Button>

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
            <p className="font-semibold text-green-700 dark:text-green-300">Sucesso!</p>
            <p className="text-sm">Admin: {result.users.admin}</p>
            <p className="text-sm">Aluno: {result.users.student}</p>
            <p className="text-sm text-muted-foreground mt-2">Agora você pode fazer login em /login</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="font-semibold text-red-700 dark:text-red-300">Erro</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
