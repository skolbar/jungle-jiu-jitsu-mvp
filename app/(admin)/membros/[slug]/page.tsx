"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function AdminModulePage() {
  const params = useParams()
  const slug = params.slug as string
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    url: "",
    required_belt: "white",
    required_degree: 0,
    category: "Raspagens",
  })

  const fetchContents = async () => {
    try {
      const res = await fetch(`/api/contents?module_slug=${slug}`)
      if (res.ok) {
        const data = await res.json()
        setContents(data)
      }
    } catch (error) {
      console.error("Error fetching contents:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContents()
  }, [slug])

  const handleAddContent = async () => {
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newContent,
          type: "video",
          module_slug: slug,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setNewContent({
          title: "",
          description: "",
          url: "",
          required_belt: "white",
          required_degree: 0,
          category: "Raspagens",
        })
        fetchContents()
      }
    } catch (error) {
      console.error("Error adding content:", error)
    }
  }

  const handleDeleteContent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return
    try {
      const res = await fetch(`/api/contents/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchContents()
      }
    } catch (error) {
      console.error("Error deleting content:", error)
    }
  }

  const groupedContents = contents.reduce(
    (acc, content) => {
      const category = content.category || "Outros"
      if (!acc[category]) acc[category] = []
      acc[category].push(content)
      return acc
    },
    {} as Record<string, Content[]>,
  )

  const categoryOrder = ["Raspagens", "Passagens", "Finalizações"]
  const sortedCategories = Object.keys(groupedContents).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  const moduleName = MODULE_NAMES[slug] || slug

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/membros">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{moduleName}</h1>
            <p className="text-muted-foreground">{contents.length} vídeos</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Vídeo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder="Ex: Armlock da guarda"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  placeholder="Descrição do vídeo..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL do Vídeo</Label>
                <Input
                  value={newContent.url}
                  onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newContent.category}
                  onValueChange={(value) => setNewContent({ ...newContent, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raspagens">Raspagens</SelectItem>
                    <SelectItem value="Passagens">Passagens</SelectItem>
                    <SelectItem value="Finalizações">Finalizações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faixa Mínima</Label>
                  <Select
                    value={newContent.required_belt}
                    onValueChange={(value) => setNewContent({ ...newContent, required_belt: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">Branca</SelectItem>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="purple">Roxa</SelectItem>
                      <SelectItem value="brown">Marrom</SelectItem>
                      <SelectItem value="black">Preta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grau Mínimo</Label>
                  <Select
                    value={String(newContent.required_degree)}
                    onValueChange={(value) => setNewContent({ ...newContent, required_degree: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem grau</SelectItem>
                      <SelectItem value="1">1º grau</SelectItem>
                      <SelectItem value="2">2º grau</SelectItem>
                      <SelectItem value="3">3º grau</SelectItem>
                      <SelectItem value="4">4º grau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddContent} className="w-full">
                Adicionar Vídeo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sortedCategories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">{category}</h2>
          <div className="grid gap-4">
            {groupedContents[category].map((content) => (
              <Card key={content.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{content.title}</h3>
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
                    <div className="flex gap-2">
                      <a href={content.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                          <Play className="h-4 w-4" />
                          Ver
                        </Button>
                      </a>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteContent(content.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {contents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum conteúdo neste módulo. Adicione o primeiro vídeo!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
