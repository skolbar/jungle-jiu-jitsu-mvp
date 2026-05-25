"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, User, MoreVertical } from "lucide-react"
import { getBeltColor } from "@/lib/mock-data"
import { StudentDialog } from "@/components/student-dialog"
import { AddClassesDialog } from "@/components/add-classes-dialog"
import { RemoveStudentDialog } from "@/components/remove-student-dialog"

export default function AlunosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | undefined>()
  const [loading, setLoading] = useState(true)
  const [addClassesOpen, setAddClassesOpen] = useState(false)
  const [removeStudentOpen, setRemoveStudentOpen] = useState(false)
  const [selectedForAction, setSelectedForAction] = useState<any | undefined>()

  useEffect(() => {
    if (user?.role === "admin") {
      fetchStudents()
    }
  }, [user])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/students")
      const data = await res.json()
      setStudents(data)
    } catch (error) {
      console.error("[v0] Failed to fetch students:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return null
  }

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
            <p className="text-muted-foreground mt-1">Gerencie os alunos da academia</p>
          </div>
          <Button
            onClick={() => {
              setSelectedStudent(undefined)
              setIsDialogOpen(true)
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Aluno
          </Button>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="border-border hover:border-primary transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between cursor-pointer" onClick={() => {
                    setSelectedStudent(student)
                    setIsDialogOpen(true)
                  }}>
                    <div className="flex items-center gap-3">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url || "/placeholder.svg"}
                          alt={student.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2"
                          style={{
                            borderColor:
                              student.belt === "white" ? "#6E6E6E" : getBeltColor(capitalizeFirst(student.belt)),
                          }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-muted"
                          style={{
                            borderColor:
                              student.belt === "white" ? "#6E6E6E" : getBeltColor(capitalizeFirst(student.belt)),
                          }}
                        >
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-foreground">{student.full_name}</span>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border-2"
                      style={{
                        backgroundColor: getBeltColor(capitalizeFirst(student.belt)),
                        borderColor: student.belt === "white" ? "#6E6E6E" : getBeltColor(capitalizeFirst(student.belt)),
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm font-medium text-foreground">
                      {capitalizeFirst(student.belt)} - {student.degree}º grau
                    </span>
                    <span className="text-sm text-muted-foreground">{student.total_classes} aulas</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedForAction(student)
                        setAddClassesOpen(true)
                      }}
                    >
                      Adicionar Aulas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedForAction(student)
                        setRemoveStudentOpen(true)
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <StudentDialog
        student={selectedStudent}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={() => {
          fetchStudents()
        }}
      />

      <AddClassesDialog
        student={selectedForAction}
        open={addClassesOpen}
        onOpenChange={setAddClassesOpen}
        onSave={() => {
          fetchStudents()
        }}
      />

      <RemoveStudentDialog
        student={selectedForAction}
        open={removeStudentOpen}
        onOpenChange={setRemoveStudentOpen}
        onRemoved={() => {
          fetchStudents()
        }}
      />
    </DashboardLayout>
  )
}
