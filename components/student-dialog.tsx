"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  full_name: string
  email: string
  belt: string
  degree: number
  total_classes: number
}

interface StudentDialogProps {
  student?: Student
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function StudentDialog({ student, open, onOpenChange, onSave }: StudentDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    belt: "white",
    degree: "0",
    password: "",
    role: "student",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (student) {
      setFormData({
        full_name: student.full_name,
        email: student.email,
        belt: student.belt,
        degree: String(student.degree ?? 0),
        password: "",
        role: "student",
      })
    } else {
      setFormData({
        full_name: "",
        email: "",
        belt: "white",
        degree: "0",
        password: "",
        role: "student",
      })
    }
    setError("")
  }, [student, open])

  const handleDegreeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    const num = Number.parseInt(cleaned || "0", 10)
    const clamped = Math.max(0, Math.min(4, num))
    setFormData({ ...formData, degree: String(clamped) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return

    setError("")

    if (!student && formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setSaving(true)
    try {
      if (student) {
        // Update existing student
        const response = await fetch(`/api/students/${student.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            belt: formData.belt,
            degree: Number.parseInt(formData.degree, 10) || 0,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Erro ao atualizar aluno")
        }
      } else {
        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            belt: formData.belt,
            degree: Number.parseInt(formData.degree, 10) || 0,
            role: formData.role,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erro ao criar aluno")
        }
      }

      toast({
        title: student ? "Aluno atualizado" : "Aluno criado",
        description: student ? "Os dados foram atualizados com sucesso." : "O novo aluno foi criado com sucesso.",
      })

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving student:", error)
      setError(error.message || "Erro ao salvar aluno")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{student ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={!!student}
            />
          </div>

          {!student && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="belt">Faixa</Label>
              <Select value={formData.belt} onValueChange={(value) => setFormData({ ...formData, belt: value })}>
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
              <Label htmlFor="degree">Grau</Label>
              <Input
                id="degree"
                type="text"
                inputMode="numeric"
                pattern="[0-4]"
                min={0}
                max={4}
                value={formData.degree}
                onChange={(e) => handleDegreeChange(e.target.value)}
                required
              />
            </div>
          </div>

          {!student && (
            <div className="space-y-2">
              <Label htmlFor="role">Tipo</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="admin">Professor/Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
