"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanLine, CheckCircle } from "lucide-react"

export default function CatracaPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [studentId, setStudentId] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [attendances, setAttendances] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [studentsRes, attendancesRes] = await Promise.all([fetch("/api/students"), fetch("/api/attendances")])
      setStudents(await studentsRes.json())
      setAttendances(await attendancesRes.json())
    } catch (error) {
      console.error("[v0] Failed to fetch data:", error)
    }
  }

  if (isLoading || !user) {
    return null
  }

  const handleRegisterAttendance = async () => {
    const student = students.find((s) => s.id === studentId)

    if (student) {
      try {
        await fetch("/api/attendances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: student.id }),
        })

        setMessage(`Presença registrada com sucesso para ${student.full_name}!`)
        setStudentId("")
        fetchData()
        setTimeout(() => setMessage(""), 3000)
      } catch (error) {
        console.error("[v0] Failed to register attendance:", error)
        setMessage("Erro ao registrar presença!")
        setTimeout(() => setMessage(""), 3000)
      }
    } else {
      setMessage("Aluno não encontrado!")
      setTimeout(() => setMessage(""), 3000)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catraca Virtual</h1>
          <p className="text-muted-foreground mt-1">Registre a presença dos alunos</p>
        </div>

        <Card className="border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ScanLine className="h-6 w-6 text-primary" />
              Registrar Presença
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ID do aluno ou nome..."
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegisterAttendance()}
                className="flex-1"
              />
              <Button onClick={handleRegisterAttendance} className="bg-primary hover:bg-primary/90">
                Registrar
              </Button>
            </div>
            {message && (
              <div
                className={`p-3 rounded-lg ${message.includes("sucesso") ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Presenças de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendances.slice(0, 10).map((attendance) => (
                <div key={attendance.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{attendance.student?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.date).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
