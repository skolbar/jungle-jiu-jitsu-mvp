import type { Belt } from "./types"

export const BELT_ORDER: Belt[] = ["white", "blue", "purple", "brown", "black"]

export const BELT_RANKS: Record<Belt, number> = {
  white: 1,
  blue: 2,
  purple: 3,
  brown: 4,
  black: 5,
}

export const BELT_COLORS: Record<Belt, string> = {
  white: "#FFFFFF",
  blue: "#2563EB",
  purple: "#7C3AED",
  brown: "#92400E",
  black: "#1A1A1A",
}

export const BELT_NAMES_PT: Record<Belt, string> = {
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
}

export function isBeltAtLeast(studentBelt: Belt, minBelt: Belt): boolean {
  return BELT_RANKS[studentBelt] >= BELT_RANKS[minBelt]
}

export function getBeltRank(belt: Belt): number {
  return BELT_RANKS[belt]
}

export function getBeltName(belt: string): string {
  const normalized = belt.toLowerCase() as Belt
  return BELT_NAMES_PT[normalized] || belt
}

export function getBeltOrder(belt: string): number {
  const order = ["white", "blue", "purple", "brown", "black"]
  return order.indexOf(belt.toLowerCase())
}
