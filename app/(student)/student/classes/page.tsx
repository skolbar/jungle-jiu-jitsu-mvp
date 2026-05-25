"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Lock, ChevronRight, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getBeltName } from "@/lib/domain/belts"
import { SAFE_PROFILE_COLUMNS } from "@/lib/domain/profile-select"

interface Module {
  slug: string
  title: string
  description: string
  videoCount: number
  requiredBelt: string
  requiredDegree: number
}

export default function StudentClassesPage() {
  const { user, isLoading } = useAuth()

  const [modules, setModules] = useState<Module[]>([])
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatModuleTitle = (slug: string): string => {
    const titles: Record<string, string> = {
      "guarda-fechada": "Guarda Fechada",
      "guarda-aberta": "Guarda Aberta",
      "passagem-de-guarda": "Passagem de Guarda",
      montada: "Montada",
      costas: "Costas",
      geral: "Conteúdos Gerais",
    }
    return titles[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const getModuleDescription = (slug: string): string => {
    const descriptions: Record<string, string> = {
      "guarda-fechada": "Técnicas fundamentais da guarda fechada: raspagens, passagens e finalizações",
      "guarda-aberta": "Variações e técnicas da guarda aberta",
      "passagem-de-guarda": "Técnicas para passar a guarda do oponente",
      montada: "Controle e finalizações da posição montada",
      costas: "Controle e finalizações das costas",
      geral: "Conteúdos diversos e complementares",
    }
    return descriptions[slug] || "Módulo de técnicas de Jiu-Jitsu"
  }

  useEffect(() => {
    // Guard real fica no app/(student)/layout.tsx (server).
    // Aqui apenas buscamos dados quando o AuthContext já está pronto.
    if (isLoading) return
    if (!user || user.role !== "student") return

    let cancelled = false

    const fetchData = async () => {
      try {
        const supabase = createClient()

        const [contentsRes, profileRes] = await Promise.all([
          supabase
            .from("contents")
            .select("id,title,description,type,url,required_belt,required_degree,module_slug,category,created_at")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select(SAFE_PROFILE_COLUMNS).eq("id", user.id).single(),
        ])

        if (contentsRes.error) throw contentsRes.error
        if (profileRes.error) throw profileRes.error

        const contents = contentsRes.data || []
        const moduleMap = new Map<string, Module>()

        contents.forEach((content: any) => {
          const slug = content.module_slug || "geral"
          if (!moduleMap.has(slug)) {
            moduleMap.set(slug, {
              slug,
              title: formatModuleTitle(slug),
              description: getModuleDescription(slug),
              videoCount: 0,
              requiredBelt: content.required_belt || "white",
              requiredDegree: content.required_degree || 0,
            })
          }
          const mod = moduleMap.get(slug)!
          mod.videoCount++
        })

        if (!cancelled) {
          setModules(Array.from(moduleMap.values()))
          setStudent(profileRes.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [user, isLoading])

  const isModuleUnlocked = useMemo(() => {
    return (module: Module) => {
      if (!student) return false

      const beltOrder = ["white", "blue", "purple", "brown", "black"]
      const studentBeltIndex = beltOrder.indexOf(student.belt)
      const requiredBeltIndex = beltOrder.indexOf(module.requiredBelt)

      if (studentBeltIndex > requiredBeltIndex) return true
      if (studentBeltIndex === requiredBeltIndex && student.degree >= module.requiredDegree) return true
      return false
    }
  }, [student])

  if (isLoading || !user || user.role !== "student" || loading || !student) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">Acesse suas aulas e materiais por módulo</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const unlocked = isModuleUnlocked(module)
            return unlocked ? (
              <Link key={module.slug} href={`/student/modulos/${module.slug}`}>
                <Card className="border-border hover:border-primary transition-all cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="text-foreground">{module.title}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span>{module.videoCount} vídeos</span>
                      </div>
                      <span className="text-xs text-primary font-medium">Disponível</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card key={module.slug} className="border-border opacity-60 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <span className="text-foreground">{module.title}</span>
                    </div>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>{module.videoCount} vídeos</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Requisito: {getBeltName(module.requiredBelt)}
                      {module.requiredDegree > 0 && ` ${module.requiredDegree}º grau`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {modules.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum módulo disponível no momento.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
