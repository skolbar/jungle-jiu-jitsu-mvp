export type BeltColor = "Branca" | "Azul" | "Roxa" | "Marrom" | "Preta"

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  belt: BeltColor
  degree: number
  photo?: string
  classCount: number
  createdAt: string
}

export interface Attendance {
  id: string
  studentId: string
  studentName: string
  timestamp: string
}

export interface CheckIn {
  id: string
  studentId: string
  studentName: string
  studentBelt: BeltColor
  studentDegree: number
  timestamp: string
  status: "pending" | "approved" | "rejected"
}

export interface Communication {
  id: string
  message: string
  timestamp: string
  author: string
}

export interface Content {
  id: string
  title: string
  description: string
  requiredBelt: BeltColor
  requiredDegree: number
  thumbnail?: string
  type: "video" | "document" | "article"
}

// Mock students data
export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos@email.com",
    phone: "(11) 98765-4321",
    belt: "Branca",
    degree: 2,
    classCount: 45,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Ana Santos",
    email: "ana@email.com",
    phone: "(11) 98765-4322",
    belt: "Azul",
    degree: 1,
    classCount: 120,
    createdAt: "2023-08-10",
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro@email.com",
    phone: "(11) 98765-4323",
    belt: "Branca",
    degree: 3,
    classCount: 89,
    createdAt: "2023-11-20",
  },
  {
    id: "4",
    name: "Mariana Costa",
    email: "mariana@email.com",
    phone: "(11) 98765-4324",
    belt: "Roxa",
    degree: 2,
    classCount: 245,
    createdAt: "2022-05-05",
  },
]

export const mockAttendances: Attendance[] = [
  {
    id: "1",
    studentId: "1",
    studentName: "Carlos Silva",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    studentId: "2",
    studentName: "Ana Santos",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
]

export const mockCheckIns: CheckIn[] = [
  {
    id: "1",
    studentId: "3",
    studentName: "Pedro Oliveira",
    studentBelt: "Branca",
    studentDegree: 3,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    status: "pending",
  },
]

export const mockCommunications: Communication[] = [
  {
    id: "1",
    message: "Aula especial de raspagens amanhã às 19h!",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    author: "Professor João",
  },
]

export const mockContents: Content[] = [
  {
    id: "1",
    title: "Fundamentos do Jiu-Jitsu",
    description: "Aprenda as posições básicas e movimentações fundamentais",
    requiredBelt: "Branca",
    requiredDegree: 0,
    type: "video",
  },
  {
    id: "2",
    title: "Raspagens da Guarda Fechada",
    description: "Técnicas avançadas de raspagem",
    requiredBelt: "Azul",
    requiredDegree: 0,
    type: "video",
  },
  {
    id: "3",
    title: "Passagens de Guarda",
    description: "Como passar a guarda do adversário",
    requiredBelt: "Branca",
    requiredDegree: 2,
    type: "video",
  },
]

export const getBeltColor = (belt: string): string => {
  const colors: Record<BeltColor, string> = {
    Branca: "#FFFFFF",
    Azul: "#2563EB",
    Roxa: "#7C3AED",
    Marrom: "#92400E",
    Preta: "#1A1A1A",
  }
  return colors[belt as BeltColor] || "#6E6E6E"
}
