"use client"

import { useState } from "react"
import type { Profile } from "@/lib/domain/types"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Award, TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react"
import { getBeltColor } from "@/lib/mock-data"
import { computeGraduationProgress } from "@/lib/domain/graduation"

export default function StudentHomeClient({ profile }: { profile: Profile }) {
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [checkInMessage, setCheckInMessage] = useState("")

  const graduationProgress = computeGraduationProgress(profile)
  const progress = graduationProgress.progressPct

  const handleCheckIn = async () => {
    try {
      await fetch("/api/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      setHasCheckedIn(true)
      setCheckInMessage("Check-in realizado! Aguardando validação do professor.")
    } catch (error) {
      console.error("[v0] Failed to check-in:", error)
      setCheckInMessage("Erro ao fazer check-in. Tente novamente.")
    }
  }

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <Card className="border-border bg-gradient-to-br from-secondary to-secondary/80">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4"
                  style={{
                    borderColor: profile.belt === "white" ? "#6E6E6E" : getBeltColor(capitalizeFirst(profile.belt)),
                  }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
                  style={{
                    backgroundColor: getBeltColor(capitalizeFirst(profile.belt)),
                    borderColor: profile.belt === "white" ? "#6E6E6E" : getBeltColor(capitalizeFirst(profile.belt)),
                  }}
                >
                  <Award className="h-12 w-12 text-sidebar-foreground" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-sidebar-foreground">{profile.full_name}</h2>
                <p className="text-sidebar-foreground/80 mt-1">
                  {capitalizeFirst(profile.belt)} - {profile.degree}º Grau
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHECK-IN CARD TEMPORARIAMENTE DESATIVADO
            Funcionalidade descontinuada temporariamente. Para reativar, remova este comentário.
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-primary" />
              Check-in de Presença
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasCheckedIn ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Faça seu check-in ao chegar na academia. Após a validação do professor, sua presença será registrada.
                </p>
                <Button onClick={handleCheckIn} className="w-full bg-primary hover:bg-primary/90">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fazer Check-in
                </Button>
              </>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{checkInMessage}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seu check-in aparecerá na lista do professor para validação.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        */}

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progresso para Próximo{" "}
              {graduationProgress.currentCycleClasses >= (graduationProgress.classesPerGrade || 0) &&
              profile.degree === 4
                ? "Faixa"
                : "Grau"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aulas no ciclo atual</span>
                <span className="font-medium text-foreground">
                  {graduationProgress.currentCycleClasses}/{graduationProgress.classesPerGrade}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
            <p className="text-sm text-muted-foreground">
              {graduationProgress.isBlackBelt
                ? "Progressão definida pelo professor"
                : graduationProgress.canPromoteBelt
                  ? "Pronto para trocar de faixa! Aguarde o professor."
                  : graduationProgress.canPromoteGrade
                    ? "Pronto para o próximo grau! Aguarde o professor."
                    : `Faltam ${graduationProgress.classesNeeded} aulas para o ${profile.degree === 4 ? "próximo estágio" : "próximo grau"}!`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total de Aulas</p>
                <p className="text-2xl font-bold text-foreground">{profile.total_classes}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Graus Conquistados</p>
                <p className="text-2xl font-bold text-foreground">{profile.degree}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
