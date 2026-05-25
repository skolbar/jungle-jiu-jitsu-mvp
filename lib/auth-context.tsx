"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Profile } from "@/lib/domain/types"
import { logoutAction } from "@/app/actions/logout"

interface AuthContextType {
  user: Profile | null
  logout: () => Promise<void>
  isLoading: boolean
  refreshProfile: () => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchMe(signal?: AbortSignal): Promise<{ ok: true; user: Profile } | { ok: false; status: number }> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    cache: "no-store",
    signal,
  })

  if (!res.ok) {
    return { ok: false, status: res.status }
  }

  const json = await res.json()
  const user = (json?.user as Profile) ?? null
  if (!user) return { ok: false, status: 401 }

  return { ok: true, user }
}

function isPublicPath(pathname: string) {
  if (!pathname) return false
  if (pathname === "/login") return true
  if (pathname.startsWith("/auth/")) return true
  return false
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  const abortRef = useRef<AbortController | null>(null)
  const hasLoadedOnceRef = useRef(false)

  const refreshProfile = useCallback(async () => {
    // evita corrida/abort em navegação
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    try {
      const result = await fetchMe(ac.signal)

      if (!result.ok) {
        // 401 aqui é normal quando não está logado
        setUser(null)
        return null
      }

      setUser(result.user)
      return result.user
    } catch {
      // abort/fetch cancelado: não faz nada
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Regra principal: NÃO consultar /api/auth/me em rotas públicas.
    // Isso elimina o spam infinito no /login e /auth/*.
    if (isPublicPath(pathname)) {
      if (mounted) {
        setUser(null)
        setIsLoading(false)
        hasLoadedOnceRef.current = true
      }
      return () => {
        mounted = false
        abortRef.current?.abort()
      }
    }

    // Em rotas privadas: carrega uma vez (e só recarrega se você chamar refreshProfile manualmente)
    ;(async () => {
      try {
        await refreshProfile()
      } finally {
        if (mounted) {
          setIsLoading(false)
          hasLoadedOnceRef.current = true
        }
      }
    })()

    return () => {
      mounted = false
      abortRef.current?.abort()
    }
  }, [pathname, refreshProfile])

  const logout = useCallback(async () => {
    try {
      await logoutAction()
    } finally {
      setUser(null)
      // volta pro login sem ficar “pingando” /api/auth/me
      router.replace("/login")
    }
  }, [router])

  return <AuthContext.Provider value={{ user, logout, isLoading, refreshProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
