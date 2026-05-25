"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { loginAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError("")
    setIsLoading(true)

    try {
      const result = await loginAction(email, password)

      if (!result?.ok) {
        setError(result?.error || "Credenciais inválidas.")
        setIsLoading(false)
        return
      }

      // SUCCESS: Navigate client-side only (no router.refresh)
      router.replace("/auth/post-login")

      // Fallback: if after 5 seconds we're still on /login, show error
      navigationTimeoutRef.current = setTimeout(() => {
        if (window.location.pathname === "/login") {
          setError("Navegação falhou. Por favor, atualize a página.")
          setIsLoading(false)
        }
      }, 5000)

    } catch (err) {
      console.error("Login error:", err)
      setError("Erro ao fazer login. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="space-y-4 pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-4xl font-bold">J</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-foreground">JUNGLE JIU-JITSU</CardTitle>
          <CardDescription className="text-center text-muted-foreground text-base">Sistema de Gestão</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            {error && <p className="text-sm text-primary font-medium">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-12"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "ENTRAR"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
