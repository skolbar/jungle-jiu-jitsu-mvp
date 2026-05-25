"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Award,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  User,
  CheckSquare,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/catraca", label: "Catraca", icon: ScanLine },
  { href: "/validar-checkins", label: "Validar Check-ins", icon: CheckSquare },
  { href: "/graduacao", label: "Graduação", icon: Award },
  { href: "/membros", label: "Área de Membros", icon: BookOpen },
  { href: "/comunicados", label: "Comunicados", icon: MessageSquare },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

const studentNavItems = [
  { href: "/student/home", label: "Início", icon: Home },
  { href: "/student/classes", label: "Conteúdos", icon: BookOpen },
  { href: "/student/announcements", label: "Comunicados", icon: MessageSquare },
  { href: "/student/profile", label: "Perfil", icon: User },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout, user } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fallback por rota (não depende do AuthContext estar pronto)
  const routeIsStudent = pathname.startsWith("/student")
  const routeIsAdmin =
    pathname === "/dashboard" ||
    pathname.startsWith("/alunos") ||
    pathname.startsWith("/catraca") ||
    pathname.startsWith("/validar-checkins") ||
    pathname.startsWith("/graduacao") ||
    pathname.startsWith("/membros") ||
    pathname.startsWith("/comunicados") ||
    pathname.startsWith("/configuracoes")

  // Preferência: role (se existir), senão rota
  const isStudent = user?.role === "student" || (!user?.role && routeIsStudent)
  const isAdmin = user?.role === "admin" || (!user?.role && routeIsAdmin)

  const navItems = useMemo(() => (isAdmin ? adminNavItems : studentNavItems), [isAdmin])
  const showSidebar = isAdmin || isStudent

  // Fecha drawer ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Trava scroll quando drawer aberto
  useEffect(() => {
    if (!mobileOpen) return
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [mobileOpen])

  const Brand = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
        <span className="text-primary-foreground text-xl font-bold">J</span>
      </div>
      <span className="text-xl font-bold text-foreground">JUNGLE</span>
    </div>
  )

  const navLinkClass = (isActive: boolean) =>
    cn(
      "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
      "transition-all duration-150 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // hover/tap feedback (web + mobile)
      "hover:bg-primary hover:text-primary-foreground hover:shadow-sm hover:-translate-y-[1px]",
      "active:translate-y-0 active:scale-[0.99] active:bg-primary active:text-primary-foreground",
      // active route stays red
      isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground",
    )

  const SidebarContent = ({ showClose }: { showClose: boolean }) => (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-16 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-2">{Brand}</div>

        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="transition-all hover:bg-muted active:scale-[0.98]"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={navLinkClass(isActive)}>
              <Icon className={cn("h-5 w-5 transition-transform duration-150", "group-hover:scale-105")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          onClick={logout}
          variant="ghost"
          className={cn(
            "w-full justify-start",
            "transition-all duration-150",
            "hover:bg-primary hover:text-primary-foreground hover:shadow-sm",
            "active:scale-[0.99]",
          )}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar (lg+) */}
      {showSidebar && (
        <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-background">
          <SidebarContent showClose={false} />
        </aside>
      )}

      {/* Mobile Topbar + Drawer */}
      {showSidebar && (
        <>
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-lg font-bold">J</span>
              </div>
              <span className="text-lg font-bold text-foreground">JUNGLE</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu"
              className={cn(
                "transition-all duration-150",
                "hover:bg-muted active:scale-[0.98]",
                mobileOpen ? "ring-2 ring-primary/30" : "",
              )}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </header>

          {/* Overlay */}
          {mobileOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/45 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Drawer (RIGHT SIDE) */}
          <aside
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] lg:hidden",
              "bg-background border-l border-border shadow-2xl", // fundo SOLIDO + borda
              "transform transition-transform duration-200 ease-out",
              mobileOpen ? "translate-x-0" : "translate-x-full",
            )}
            role="dialog"
            aria-modal="true"
          >
            <SidebarContent showClose />
          </aside>
        </>
      )}

      {/* Main */}
      <main className={cn("min-h-screen", showSidebar ? "lg:pl-64" : "")}>{children}</main>
    </div>
  )
}
