// Agora apenas checa cookie sb-*-auth-token sem fazer chamadas ao Supabase
import { NextResponse, type NextRequest } from "next/server"

const adminPaths = [
  "/dashboard",
  "/alunos",
  "/catraca",
  "/graduacao",
  "/conteudos",
  "/comunicados",
  "/validar-checkins",
  "/configuracoes",
  "/membros",
]

const studentPrefix = "/student"

function isProtectedPath(pathname: string) {
  return adminPaths.some((p) => pathname.startsWith(p)) || pathname.startsWith(studentPrefix)
}

function hasSupabaseAuthCookie(req: NextRequest) {
  const cookies = req.cookies.getAll()
  return cookies.some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  if (!hasSupabaseAuthCookie(request)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
