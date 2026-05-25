"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { computeGraduationProgress, CLASSES_PER_GRADE } from "@/lib/domain/graduation"

const getBeltColor = (belt: string) => {
  const colors: Record<string, string> = {
    white: "#FFFFFF",
    blue: "#2563EB",
    purple: "#7C3AED",
    brown: "#92400E",
    black: "#1A1A1A",
  }
  return colors[belt] || "#FFFFFF"
}

export default function GraduacaoPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("total_classes", { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const eligibleStudents = students.filter((s) => {
    const progress = computeGraduationProgress(s)
    return (progress.canPromoteGrade || progress.canPromoteBelt) && !progress.isBlackBelt
  })

  const handlePromote = async (studentId: string) => {
    try {
      const student = students.find((s) => s.id === studentId)
      if (!student) return

      const progress = computeGraduationProgress(student)

      let newBelt = student.belt
      let newDegree = student.degree

      if (progress.canPromoteBelt) {
        // Promote to next belt
        const beltOrder = ["white", "blue", "purple", "brown", "black"]
        const currentIndex = beltOrder.indexOf(student.belt)

        if (currentIndex < beltOrder.length - 1) {
          newBelt = beltOrder[currentIndex + 1]
          newDegree = 0
        } else {
          alert("Aluno já está no grau máximo!")
          return
        }
      } else if (progress.canPromoteGrade) {
        // Promote to next grade
        newDegree = student.degree + 1
      } else {
        alert("Aluno não está elegível para promoção.")
        return
      }

      const response = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belt: newBelt, degree: newDegree }),
      })

      if (!response.ok) throw new Error("Failed to promote student")

      await fetchStudents()
    } catch (error) {
      console.error("Error promoting student:", error)
    }
  }

  if (isLoading || !user || loading) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Graduação</h1>
          <p className="text-muted-foreground mt-1">Gerencie as graduações dos alunos</p>
        </div>

        <Card className="border-border bg-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-primary" />
              Regras de Graduação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-foreground">
              <strong>Faixa Branca:</strong> {CLASSES_PER_GRADE.white} aulas por grau
            </p>
            <p className="text-sm text-foreground">
              <strong>Faixa Azul:</strong> {CLASSES_PER_GRADE.blue} aulas por grau
            </p>
            <p className="text-sm text-foreground">
              <strong>Faixa Roxa:</strong> {CLASSES_PER_GRADE.purple} aulas por grau
            </p>
            <p className="text-sm text-foreground">
              <strong>Faixa Marrom:</strong> {CLASSES_PER_GRADE.brown} aulas por grau
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Faixa Preta:</strong> Progressão manual pelo professor
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Após 4º grau, o aluno precisa completar mais um ciclo completo para ficar apto à troca de faixa.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <span>Alunos Elegíveis para Graduação</span>
              <span className="text-lg font-bold text-primary">{eligibleStudents.length}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eligibleStudents.length > 0 ? (
              <div className="space-y-4">
                {eligibleStudents.map((student) => {
                  const progress = computeGraduationProgress(student)
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                          style={{
                            backgroundColor: getBeltColor(student.belt),
                            borderColor: student.belt === "white" ? "#6E6E6E" : getBeltColor(student.belt),
                          }}
                        >
                          <TrendingUp className="h-6 w-6 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.belt} {student.degree}º grau • {student.cycle_classes}/{progress.classesPerGrade}{" "}
                            aulas no ciclo • {progress.progressPct}% completo
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => handlePromote(student.id)} className="bg-primary hover:bg-primary/90">
                        {progress.canPromoteBelt ? "Trocar Faixa" : "Conceder Grau"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum aluno elegível no momento</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Todos os Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => {
                const progress = computeGraduationProgress(student)
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border-2"
                        style={{
                          backgroundColor: getBeltColor(student.belt),
                          borderColor: student.belt === "white" ? "#6E6E6E" : getBeltColor(student.belt),
                        }}
                      />
                      <div>
                        <p className="font-medium text-foreground">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.belt} {student.degree}º grau
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{student.total_classes} aulas totais</p>
                      {!progress.isBlackBelt && progress.classesPerGrade && (
                        <p className="text-xs text-muted-foreground">
                          {student.cycle_classes}/{progress.classesPerGrade} no ciclo
                        </p>
                      )}
                      {progress.isBlackBelt && <p className="text-xs text-muted-foreground">Progressão manual</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
