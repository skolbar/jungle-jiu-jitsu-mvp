import type { Belt } from "./types"

export const BELT_ORDER: Belt[] = ["WHITE", "BLUE", "PURPLE", "BROWN", "BLACK"]

export const BELT_RANKS: Record<Belt, number> = {
  WHITE: 1,
  BLUE: 2,
  PURPLE: 3,
  BROWN: 4,
  BLACK: 5,
}

export const BELT_COLORS: Record<Belt, string> = {
  WHITE: "#FFFFFF",
  BLUE: "#2563EB",
  PURPLE: "#7C3AED",
  BROWN: "#92400E",
  BLACK: "#1A1A1A",
}

export const BELT_NAMES_PT: Record<Belt, string> = {
  WHITE: "Branca",
  BLUE: "Azul",
  PURPLE: "Roxa",
  BROWN: "Marrom",
  BLACK: "Preta",
}

export function isBeltAtLeast(studentBelt: Belt, minBelt: Belt): boolean {
  return BELT_RANKS[studentBelt] >= BELT_RANKS[minBelt]
}

export function getBeltRank(belt: Belt): number {
  return BELT_RANKS[belt]
}

export function getBeltName(belt: string): string {
  const beltUpper = belt.toUpperCase() as Belt
  return BELT_NAMES_PT[beltUpper] || belt
}

export function getBeltOrder(belt: string): number {
  const order = ["white", "blue", "purple", "brown", "black"]
  return order.indexOf(belt.toLowerCase())
}
