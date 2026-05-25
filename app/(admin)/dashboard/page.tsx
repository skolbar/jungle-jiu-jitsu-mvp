"use client"

import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CheckCircle, Award, TrendingUp, AlertTriangle } from "lucide-react"
import { computeGraduationProgress } from "@/lib/domain/graduation"
import { getBeltName } from "@/lib/domain/belts"

// Belt colors for visual indicator
const BELT_BG_COLORS: Record<string, string> = {
  white: "bg-gray-100 border border-gray-300",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  brown: "bg-amber-800",
  black: "bg-gray-900",
}

type SortFilter = "graduation" | "alphabetical"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({
    activeStudents: 0,
    todayAttendances: 0,
    studentsNearDegree: 0,
    recentGraduations: 0,
  })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [recentAttendances, setRecentAttendances] = useState<any[]>([])
  const [absentStudents, setAbsentStudents] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [sortFilter, setSortFilter] = useState<SortFilter>("graduation")

  useEffect(() => {
    if (user?.role === "admin" && !dataLoaded) {
      fetchDashboardData()
    }
  }, [user, dataLoaded])

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, attendancesRes, lastAttendanceRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/attendances"),
        fetch("/api/attendances/last"),
      ])

      const studentsData = await studentsRes.json()
      const attendancesData = await attendancesRes.json()
      const lastAttendanceData = await lastAttendanceRes.json()

      // Handle API responses - ensure we have arrays
      const students = Array.isArray(studentsData) ? studentsData : []
      const attendances = Array.isArray(attendancesData) ? attendancesData : []
      const lastAttendances = Array.isArray(lastAttendanceData) ? lastAttendanceData : []

      const today = new Date().toDateString()
      const todayAttendances = attendances.filter((a: any) => new Date(a.date).toDateString() === today)

      // Filter students near graduation (>=80%) for stats counter only
      const studentsNearDegree = students.filter((s: any) => {
        const progress = computeGraduationProgress(s)
        return progress.progressPct >= 80 && !progress.isBlackBelt
      })

      const recentGraduations = students.filter((s: any) => s.degree > 0)

      setStats({
        activeStudents: students.length,
        todayAttendances: todayAttendances.length,
        studentsNearDegree: studentsNearDegree.length,
        recentGraduations: recentGraduations.length,
      })

      // Store ALL students (excluding black belts) for the card list
      const allStudentsForList = students.filter((s: any) => {
        const progress = computeGraduationProgress(s)
        return !progress.isBlackBelt
      })
      setRecentStudents(allStudentsForList)
      setRecentAttendances(attendances.slice(0, 5))

      // Absent students: use dedicated API that queries ALL attendances server-side
      // Already filtered to role=student only (no professors)
      const absent = lastAttendances
        .filter((s: any) => s.daysSinceLastAttendance === null || s.daysSinceLastAttendance >= 15)
        .sort((a: any, b: any) => {
          if (a.daysSinceLastAttendance === null && b.daysSinceLastAttendance === null) return 0
          if (a.daysSinceLastAttendance === null) return -1
          if (b.daysSinceLastAttendance === null) return 1
          return b.daysSinceLastAttendance - a.daysSinceLastAttendance
        })

      setAbsentStudents(absent)
      setDataLoaded(true)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    }
  }

  // Memoized sorting - recalculates only when recentStudents or sortFilter changes
  const sortedStudents = useMemo(() => {
    if (sortFilter === "alphabetical") {
      return [...recentStudents].sort((a, b) => a.full_name.localeCompare(b.full_name))
    }
    // Default: sort by graduation proximity (highest progress first)
    return [...recentStudents].sort((a, b) => {
      const progressA = computeGraduationProgress(a)
      const progressB = computeGraduationProgress(b)
      return progressB.progressPct - progressA.progressPct
    })
  }, [recentStudents, sortFilter])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const statsConfig = [
    {
      title: "Alunos Ativos",
      value: stats.activeStudents,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Presenças Hoje",
      value: stats.todayAttendances,
      icon: CheckCircle,
      color: "text-primary",
    },
    {
      title: "Próximos de Grau",
      value: stats.studentsNearDegree,
      icon: Award,
      color: "text-primary",
    },
    {
      title: "Alunos Ausentes",
      value: absentStudents.length,
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsConfig.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Alunos Próximos da Graduação</CardTitle>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSortFilter("graduation")}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    sortFilter === "graduation"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Graduação
                </button>
                <button
                  type="button"
                  onClick={() => setSortFilter("alphabetical")}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    sortFilter === "alphabetical"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  A-Z
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sortedStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado</p>
                ) : (
                  sortedStudents.map((student) => {
                    const progress = computeGraduationProgress(student)
                    const beltColorClass = BELT_BG_COLORS[student.belt?.toLowerCase()] || "bg-gray-400"
                    
                    return (
                      <div key={student.id} className="flex items-center gap-3 py-1">
                        {/* Belt color indicator */}
                        <div className={`w-3 h-8 rounded-sm flex-shrink-0 ${beltColorClass}`} />
                        
                        {/* Student info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getBeltName(student.belt)} - {student.degree}º grau
                          </p>
                        </div>
                        
                        {/* Classes info */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground">
                            {progress.currentCycleClasses}/{progress.classesPerGrade}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            faltam {progress.classesNeeded}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Últimas Presenças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAttendances.map((attendance: any) => (
                  <div key={attendance.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{attendance.student?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Absent Students Section */}
        {absentStudents.length > 0 && (
          <Card className="border-border border-yellow-500/50">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alunos Ausentes (15+ dias sem presença)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                {absentStudents.map((student) => {
                  const beltColorClass = BELT_BG_COLORS[student.belt?.toLowerCase()] || "bg-gray-400"
                  
                  return (
                    <div 
                      key={student.id} 
                      className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                    >
                      {/* Belt color indicator */}
                      <div className={`w-2 h-10 rounded-sm flex-shrink-0 ${beltColorClass}`} />
                      
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getBeltName(student.belt)} - {student.degree}º grau
                        </p>
                        <p className="text-xs text-yellow-600 font-medium mt-1">
                          {student.daysSinceLastAttendance === null 
                            ? "Nunca compareceu" 
                            : `${student.daysSinceLastAttendance} dias ausente`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
