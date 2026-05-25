"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getBeltOrder } from "@/lib/domain/belts"

interface Content {
  id: string
  title: string
  description: string
  type: string
  url: string
  required_belt: string
  required_degree: number
  module_slug: string
  category: string
}

const MODULE_NAMES: Record<string, string> = {
  "guarda-fechada": "Guarda Fechada",
}

export default function StudentModulePage() {
  const params = useParams()
  const slug = params.slug as string

  const { user, isLoading } = useAuth()
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Não dispara nada enquanto auth está resolvendo
    if (isLoading) return
    // Se não for student, o guard REAL é server-side no app/(student)/layout.tsx
    // Aqui só evita fetch inútil.
    if (!user || user.role !== "student") return

    const ac = new AbortController()

    const fetchContents = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/contents?module_slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
          signal: ac.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setContents(Array.isArray(data) ? data : [])
        } else {
          setContents([])
        }
      } catch (error: any) {
        // Abort é esperado em navegação rápida
        if (error?.name !== "AbortError") {
          console.error("Error fetching contents:", error)
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }

    fetchContents()

    return () => ac.abort()
  }, [slug, user?.role, user?.id, isLoading])

  const canAccessContent = (content: Content) => {
    if (!user) return false
    const userBeltOrder = getBeltOrder(user.belt)
    const requiredBeltOrder = getBeltOrder(content.required_belt)
    if (userBeltOrder > requiredBeltOrder) return true
    if (userBeltOrder === requiredBeltOrder && user.degree >= content.required_degree) return true
    return false
  }

  const groupedContents = useMemo(() => {
    return contents.reduce(
      (acc, content) => {
        const category = content.category || "Outros"
        if (!acc[category]) acc[category] = []
        acc[category].push(content)
        return acc
      },
      {} as Record<string, Content[]>,
    )
  }, [contents])

  const sortedCategories = useMemo(() => {
    const categoryOrder = ["Raspagens", "Passagens", "Finalizações"]
    return Object.keys(groupedContents).sort((a, b) => {
      const indexA = categoryOrder.indexOf(a)
      const indexB = categoryOrder.indexOf(b)
      if (indexA === -1 && indexB === -1) return a.localeCompare(b)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }, [groupedContents])

  const moduleName = MODULE_NAMES[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  // Enquanto auth resolve, mantém padrão do resto do app (evita piscar)
  if (isLoading || !user || user.role !== "student") {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/student/classes">
            <Button variant="ghost" size="icon" aria-label="Voltar para conteúdos">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{moduleName}</h1>
            <p className="text-muted-foreground">{contents.length} vídeos disponíveis</p>
          </div>
        </div>

        {sortedCategories.map((category) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">{category}</h2>
            <div className="grid gap-4">
              {groupedContents[category].map((content) => {
                const hasAccess = canAccessContent(content)
                return (
                  <Card key={content.id} className={hasAccess ? "border-border" : "border-border opacity-60"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{content.title}</h3>
                          {content.description && (
                            <p className="text-sm text-muted-foreground mt-1">{content.description}</p>
                          )}

                          <Badge variant="outline" className="mt-2">
                            {content.required_belt === "white"
                              ? "Branca"
                              : content.required_belt === "blue"
                                ? "Azul"
                                : content.required_belt === "purple"
                                  ? "Roxa"
                                  : content.required_belt === "brown"
                                    ? "Marrom"
                                    : "Preta"}
                            {content.required_degree > 0 && ` - ${content.required_degree}º grau`}
                          </Badge>
                        </div>

                        {hasAccess ? (
                          <a href={content.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="gap-2">
                              <Play className="h-4 w-4" />
                              Assistir
                            </Button>
                          </a>
                        ) : (
                          <Button size="sm" variant="secondary" disabled className="gap-2">
                            <Lock className="h-4 w-4" />
                            Bloqueado
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {contents.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum conteúdo disponível neste módulo.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
