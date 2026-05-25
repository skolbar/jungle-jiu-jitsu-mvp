"use client"

import { createBrowserClient } from "@supabase/ssr"

type BrowserClient = ReturnType<typeof createBrowserClient>

declare global {
  interface Window {
    __SUPABASE_BROWSER_CLIENT__?: BrowserClient
  }
}

export function createClient(): BrowserClient {
  if (typeof window === "undefined") {
    throw new Error(
      "createClient() from lib/supabase/client.ts was called on the server. This must be browser-only."
    )
  }

  if (!window.__SUPABASE_BROWSER_CLIENT__) {
    window.__SUPABASE_BROWSER_CLIENT__ = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return window.__SUPABASE_BROWSER_CLIENT__
}
