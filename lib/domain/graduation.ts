import type { Belt, Profile } from "./types"

// Official rules: classes per grade by belt
export const CLASSES_PER_GRADE: Record<Belt, number | null> = {
  white: 35,
  blue: 65,
  purple: 75,
  brown: 85,
  black: null, // Manual promotion only
}

// Belt ranking for comparison
export function beltRank(belt: Belt): number {
  const ranks: Record<Belt, number> = {
    white: 1,
    blue: 2,
    purple: 3,
    brown: 4,
    black: 5,
  }
  return ranks[belt]
}

// Check if belt is at least the minimum required
export function isBeltAtLeast(studentBelt: Belt, minBelt: Belt): boolean {
  return beltRank(studentBelt) >= beltRank(minBelt)
}

export interface GraduationProgress {
  classesPerGrade: number | null
  currentCycleClasses: number
  classesNeeded: number | null
  progressPct: number
  isBlackBelt: boolean
  canPromoteGrade: boolean
  canPromoteBelt: boolean
}

type GraduationProfile = Pick<Profile, "belt" | "degree" | "cycle_classes">

// Compute graduation progress for a profile
export function computeGraduationProgress(profile: GraduationProfile): GraduationProgress {
  const { belt, degree, cycle_classes } = profile
  const classesPerGrade = CLASSES_PER_GRADE[belt]
  const isBlackBelt = belt === "black"

  if (isBlackBelt || classesPerGrade === null) {
    return {
      classesPerGrade: null,
      currentCycleClasses: cycle_classes,
      classesNeeded: null,
      progressPct: 0,
      isBlackBelt: true,
      canPromoteGrade: false,
      canPromoteBelt: false,
    }
  }

  const classesNeeded = Math.max(0, classesPerGrade - cycle_classes)
  const progressPct = Math.min(100, Math.round((cycle_classes / classesPerGrade) * 100))

  const canPromoteGrade = degree < 4 && cycle_classes >= classesPerGrade
  const canPromoteBelt = degree === 4 && cycle_classes >= classesPerGrade

  return {
    classesPerGrade,
    currentCycleClasses: cycle_classes,
    classesNeeded,
    progressPct,
    isBlackBelt: false,
    canPromoteGrade,
    canPromoteBelt,
  }
}

// Legacy function for backwards compatibility
export function calculateProgress(belt: Belt, grade: number, totalClasses: number): any {
  return computeGraduationProgress({ belt, degree: grade, cycle_classes: totalClasses })
}
