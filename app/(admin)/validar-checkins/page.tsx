"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Award } from "lucide-react"
import { getBeltColor } from "@/lib/mock-data"

type BulkStatus = "approved" | "rejected"

export default function ValidateCheckInsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkLoading, setBulkLoading] = useState<null | BulkStatus>(null)
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.role === "admin") {
      fetchCheckIns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchCheckIns = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/check-ins", { cache: "no-store" })
      const data = await res.json()
      setCheckIns(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Failed to fetch check-ins:", error)
    } finally {
      setLoading(false)
    }
  }

  const pendingCheckIns = useMemo(() => checkIns.filter((ci) => ci.status === "pending"), [checkIns])
  const processedCheckIns = useMemo(() => checkIns.filter((ci) => ci.status !== "pending"), [checkIns])

  if (isLoading || !user) {
    return null
  }

  const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const handleApprove = async (checkInId: string) => {
    try {
      setRowLoadingId(checkInId)
      await fetch("/api/check-ins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: checkInId, status: "approved" }),
      })
      await fetchCheckIns()
    } catch (error) {
      console.error("[v0] Failed to approve check-in:", error)
    } finally {
      setRowLoadingId(null)
    }
  }

  const handleReject = async (checkInId: string) => {
    try {
      setRowLoadingId(checkInId)
      await fetch("/api/check-ins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: checkInId, status: "rejected" }),
      })
      await fetchCheckIns()
    } catch (error) {
      console.error("[v0] Failed to reject check-in:", error)
    } finally {
      setRowLoadingId(null)
    }
  }

  const handleBulk = async (status: BulkStatus) => {
    if (pendingCheckIns.length === 0) return

    const msg =
      status === "approved"
        ? `Aprovar TODOS os ${pendingCheckIns.length} check-ins pendentes?`
        : `Rejeitar TODOS os ${pendingCheckIns.length} check-ins pendentes?`

    const ok = window.confirm(msg)
    if (!ok) return

    try {
      setBulkLoading(status)

      await fetch("/api/check-ins/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      await fetchCheckIns()
    } catch (error) {
      console.error("[v0] Failed to bulk update check-ins:", error)
    } finally {
      setBulkLoading(null)
    }
  }

  const bulkDisabled = loading || bulkLoading !== null || pendingCheckIns.length === 0

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validar Check-ins</h1>
          <p className="text-muted-foreground mt-1">Aprove ou rejeite os check-ins dos alunos</p>
        </div>

        <Card className="border-border">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-yellow-600" />
              Check-ins Pendentes
              {pendingCheckIns.length > 0 && (
                <Badge className="bg-yellow-500 hover:bg-yellow-500">{pendingCheckIns.length}</Badge>
              )}
            </CardTitle>

            {/* Ações em lote */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleBulk("approved")}
                disabled={bulkDisabled}
                className="bg-primary hover:bg-primary/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {bulkLoading === "approved" ? "Aprovando..." : "Aprovar todos"}
              </Button>

              <Button onClick={() => handleBulk("rejected")} disabled={bulkDisabled} variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                {bulkLoading === "rejected" ? "Rejeitando..." : "Rejeitar todos"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : pendingCheckIns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum check-in pendente no momento</p>
            ) : (
              <div className="space-y-3">
                {pendingCheckIns.map((checkIn) => {
                  const isRowLoading = rowLoadingId === checkIn.id || bulkLoading !== null

                  return (
                    <div key={checkIn.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        {checkIn.student?.avatar_url ? (
                          <img
                            src={checkIn.student.avatar_url || "/placeholder.svg"}
                            alt={checkIn.student.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2"
                            style={{
                              borderColor:
                                checkIn.student.belt === "white"
                                  ? "#6E6E6E"
                                  : getBeltColor(capitalizeFirst(checkIn.student.belt)),
                            }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                            style={{
                              backgroundColor: getBeltColor(capitalizeFirst(checkIn.student.belt)),
                              borderColor:
                                checkIn.student.belt === "white"
                                  ? "#6E6E6E"
                                  : getBeltColor(capitalizeFirst(checkIn.student.belt)),
                            }}
                          >
                            <Award className="h-6 w-6 text-sidebar-foreground" />
                          </div>
                        )}

                        <div>
                          <p className="font-medium text-foreground">{checkIn.student.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {capitalizeFirst(checkIn.student.belt)} - {checkIn.student.degree}º Grau
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(checkIn.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(checkIn.id)}
                          disabled={isRowLoading}
                          className="bg-primary hover:bg-primary/90 whitespace-nowrap"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(checkIn.id)}
                          disabled={isRowLoading}
                          className="border-border hover:bg-muted whitespace-nowrap"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {processedCheckIns.length > 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Check-ins Processados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedCheckIns.slice(0, 10).map((checkIn) => (
                  <div key={checkIn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {checkIn.student?.avatar_url ? (
                        <img
                          src={checkIn.student.avatar_url || "/placeholder.svg"}
                          alt={checkIn.student.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`p-2 rounded-full ${checkIn.status === "approved" ? "bg-primary/10" : "bg-muted"}`}
                        >
                          {checkIn.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-foreground">{checkIn.student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(checkIn.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={
                        checkIn.status === "approved"
                          ? "bg-primary/10 text-primary hover:bg-primary/10"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }
                    >
                      {checkIn.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
