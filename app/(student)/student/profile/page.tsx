"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Calendar, LogOut, Lock, Camera, Save, Loader2, Award, User, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBeltName } from "@/lib/domain/belts"
import type { Belt } from "@/lib/domain/types"

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

const BELT_OPTIONS: { value: Belt; label: string }[] = [
  { value: "white", label: "Branca" },
  { value: "blue", label: "Azul" },
  { value: "purple", label: "Roxa" },
  { value: "brown", label: "Marrom" },
  { value: "black", label: "Preta" },
]

export default function StudentProfilePage() {
  const { user, isLoading, logout, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  // Belt/degree lock feature
  const [editingBelt, setEditingBelt] = useState(false)
  const [savingBelt, setSavingBelt] = useState(false)
  const [beltDraft, setBeltDraft] = useState<Belt>("white")
  const [degreeDraft, setDegreeDraft] = useState<number>(0)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) throw error

      setStudent(data)
      setFullName(data.full_name || "")
      setAvatarUrl(data.avatar_url || null)

      // init drafts
      setBeltDraft((data.belt as Belt) || "white")
      setDegreeDraft(typeof data.degree === "number" ? data.degree : 0)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "student") return
    fetchProfile()
  }, [user, isLoading, fetchProfile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split(".").pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: urlWithTimestamp }),
      })

      if (!response.ok) throw new Error("Falha ao atualizar perfil")

      setAvatarUrl(urlWithTimestamp)
      setStudent({ ...student, avatar_url: urlWithTimestamp })
      setMessage({ type: "success", text: "Foto atualizada com sucesso!" })
      await refreshProfile()
    } catch (error) {
      console.error("Error uploading avatar:", error)
      setMessage({ type: "error", text: "Erro ao fazer upload da foto" })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setMessage({ type: "error", text: "Nome não pode estar vazio" })
      return
    }

    setSavingProfile(true)
    setMessage(null)

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      })

      if (!response.ok) throw new Error("Falha ao atualizar perfil")

      setStudent({ ...student, full_name: fullName })
      setEditingName(false)
      setMessage({ type: "success", text: "Nome atualizado com sucesso!" })
      await refreshProfile()
    } catch (error) {
      console.error("Error saving profile:", error)
      setMessage({ type: "error", text: "Erro ao salvar perfil" })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "A senha deve ter pelo menos 6 caracteres" })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem" })
      return
    }

    setSavingPassword(true)
    setMessage(null)

    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) throw new Error("Falha ao alterar senha")

      setNewPassword("")
      setConfirmPassword("")
      setEditingPassword(false)
      setMessage({ type: "success", text: "Senha alterada com sucesso!" })
    } catch (error) {
      console.error("Error changing password:", error)
      setMessage({ type: "error", text: "Erro ao alterar senha" })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSaveBeltOnce = async () => {
    if (!student) return

    // client-side guard (server is the real guard)
    if (student.belt_locked) {
      setMessage({ type: "error", text: "Sua faixa e grau já foram definidos e estão bloqueados." })
      return
    }

    setSavingBelt(true)
    setMessage(null)

    try {
      const response = await fetch("/api/profile/belt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belt: beltDraft, degree: degreeDraft }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const msg = data?.error || "Falha ao atualizar faixa/grau"
        throw new Error(msg)
      }

      const updated = await response.json()
      setStudent(updated)
      setEditingBelt(false)
      setMessage({ type: "success", text: "Faixa e grau definidos com sucesso! A partir de agora, ficam bloqueados." })

      // Atualiza também o AuthContext (pra refletir em outras telas)
      await refreshProfile()
    } catch (error: any) {
      console.error("Error updating belt/degree:", error)
      setMessage({ type: "error", text: error?.message || "Erro ao atualizar faixa/grau" })
    } finally {
      setSavingBelt(false)
    }
  }

  if (isLoading || !user || user.role !== "student" || loading || !student) {
    return null
  }

  const isBeltLocked = Boolean(student.belt_locked)

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">Suas informações pessoais</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4" style={{ borderColor: getBeltColor(student.belt) }}>
                  <AvatarImage src={avatarUrl || undefined} alt={student.full_name} />
                  <AvatarFallback
                    className="text-xl font-bold"
                    style={{
                      backgroundColor: getBeltColor(student.belt),
                      color: student.belt === "white" ? "#1A1A1A" : "#FFFFFF",
                    }}
                  >
                    {student.full_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-primary bg-background"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </div>

              <div>
                <CardTitle className="text-2xl text-foreground">{student.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Faixa {getBeltName(student.belt)} - {student.degree}º Grau
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-foreground">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>Membro desde {new Date(student.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Total de aulas</p>
              <p className="text-2xl font-bold text-primary">{student.total_classes}</p>
            </div>
          </CardContent>
        </Card>

        {/* FAIXA E GRAU - apenas 1 vez */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Faixa e Grau
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isBeltLocked ? (
              <div className="rounded-lg border border-border p-4">
                <p className="text-foreground font-medium">
                  Definido: Faixa {getBeltName(student.belt)} — {student.degree}º Grau
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua faixa e grau já foram definidos e estão bloqueados. Para alterar novamente, apenas o professor/admin.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="text-foreground font-medium">Atenção</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você pode definir sua faixa e grau apenas uma vez. Após salvar, ficará bloqueado.
                  </p>
                </div>

                {!editingBelt ? (
                  <Button
                    variant="outline"
                    onClick={() => setEditingBelt(true)}
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Definir Faixa e Grau (1 vez)
                  </Button>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-foreground">Faixa</Label>
                        <select
                          value={beltDraft}
                          onChange={(e) => setBeltDraft(e.target.value as Belt)}
                          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                        >
                          {BELT_OPTIONS.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground">Grau</Label>
                        <select
                          value={degreeDraft}
                          onChange={(e) => setDegreeDraft(Number(e.target.value))}
                          className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                        >
                          {[0, 1, 2, 3, 4].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveBeltOnce}
                        disabled={savingBelt}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {savingBelt ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar e Bloquear
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingBelt(false)
                          setBeltDraft((student.belt as Belt) || "white")
                          setDegreeDraft(typeof student.degree === "number" ? student.degree : 0)
                        }}
                        className="border-border"
                        disabled={savingBelt}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" />
              Editar Nome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingName ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingName(false)} className="border-border">
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditingName(true)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <User className="mr-2 h-4 w-4" />
                Alterar Nome
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Lock className="h-5 w-5 text-primary" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingPassword ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background border-border"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !newPassword || !confirmPassword}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Alterar Senha
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPassword(false)
                      setNewPassword("")
                      setConfirmPassword("")
                    }}
                    className="border-border"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditingPassword(true)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </DashboardLayout>
  )
}
