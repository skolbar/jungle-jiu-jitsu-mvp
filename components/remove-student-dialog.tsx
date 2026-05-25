"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface RemoveStudentDialogProps {
  student?: { id: string; full_name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoved: () => void
}

export function RemoveStudentDialog({ student, open, onOpenChange, onRemoved }: RemoveStudentDialogProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    if (!student || deleting) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao remover aluno")
      }

      toast({
        title: "Aluno removido",
        description: `${student.full_name} foi removido permanentemente do sistema.`,
      })

      onRemoved()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error deleting student:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover aluno",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Remover Aluno?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Esta ação é irreversível e não pode ser desfeita.</p>
            <p className="font-semibold text-foreground">Aluno: {student?.full_name}</p>
            <p className="text-sm">Todos os registros, presenças e dados associados serão deletados permanentemente.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleting ? "Removendo..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
