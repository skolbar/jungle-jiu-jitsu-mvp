"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AddClassesDialogProps {
  student?: { id: string; full_name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function AddClassesDialog({ student, open, onOpenChange, onSave }: AddClassesDialogProps) {
  const { toast } = useToast()
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      setQuantity("")
      setReason("")
      setError("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving || !student) return

    setError("")

    const numQuantity = Number.parseInt(quantity, 10)
    if (!quantity || numQuantity <= 0) {
      setError("Informe uma quantidade válida de aulas")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/students/${student.id}/add-classes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: numQuantity,
          reason: reason.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao adicionar aulas")
      }

      toast({
        title: "Aulas adicionadas",
        description: `${numQuantity} aula(s) adicionada(s) para ${student.full_name}.`,
      })

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding classes:", error)
      setError(error.message || "Erro ao adicionar aulas")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Adicionar Aulas - {student?.full_name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de Aulas</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Aulas ministradas no infantil"
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={saving}>
              {saving ? "Confirmando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
