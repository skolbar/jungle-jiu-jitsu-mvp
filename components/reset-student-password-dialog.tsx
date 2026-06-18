"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ResetStudentPasswordDialogProps {
  student?: { id: string; full_name: string; email?: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResetStudentPasswordDialog({ student, open, onOpenChange }: ResetStudentPasswordDialogProps) {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const resetFields = () => {
    setPassword("")
    setConfirmPassword("")
    setError("")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetFields()
    }

    onOpenChange(nextOpen)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !student) return

    setError("")

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/students/${student.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao redefinir senha")
      }

      toast({
        title: "Senha redefinida",
        description: `A nova senha de ${student.full_name} ja pode ser usada no app e na web.`,
      })

      handleOpenChange(false)
    } catch (resetError) {
      console.error("Error resetting student password:", resetError)
      setError(resetError instanceof Error ? resetError.message : "Erro ao redefinir senha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Redefinir senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{student?.full_name}</p>
            {student?.email ? <p className="text-sm text-muted-foreground">{student.email}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-password">Nova senha</Label>
            <Input
              id="student-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 6 caracteres"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-password-confirm">Confirmar nova senha</Label>
            <Input
              id="student-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Digite novamente"
              autoComplete="new-password"
              required
            />
          </div>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
