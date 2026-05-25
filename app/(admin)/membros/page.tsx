"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Video, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getBeltName } from "@/lib/domain/belts"

interface Module {
  slug: string
  title: string
  description: string
  videoCount: number
  requiredBelt: string
  requiredDegree: number
}

export default function MembrosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchContents()
    }
  }, [user])

  const fetchContents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contents")
        .select("id,title,description,type,url,required_belt,required_degree,module_slug,category,created_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      const contents = data || []
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

      setModules(Array.from(moduleMap.values()))
    } catch (error) {
      console.error("Error fetching contents:", error)
    } finally {
      setLoading(false)
    }
  }

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

  if (isLoading || !user || loading) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Área de Membros</h1>
            <p className="text-muted-foreground mt-1">Gerencie os módulos e conteúdos disponíveis</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.slug} href={`/membros/${module.slug}`}>
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
                    <span className="text-xs text-muted-foreground">
                      {getBeltName(module.requiredBelt)}
                      {module.requiredDegree > 0 && ` ${module.requiredDegree}º`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {modules.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum módulo cadastrado ainda.</p>
              <Button className="mt-4 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Módulo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
