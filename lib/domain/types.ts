export type Belt = "white" | "blue" | "purple" | "brown" | "black"
export type Role = "admin" | "student"
export type CheckInStatus = "pending" | "approved" | "rejected"
export type AttendanceSource = "student_checkin" | "admin_manual"

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  belt: Belt
  degree: number
  total_classes: number
  cycle_classes: number
  avatar_url: string | null
  belt_locked: boolean
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  student_id: string
  status: CheckInStatus
  created_at: string
  validated_by: string | null
  validated_at: string | null
  student?: Profile
  validator?: Profile
}

export interface Attendance {
  id: string
  student_id: string
  recorded_by: string
  created_at: string
  source: AttendanceSource
  student?: Profile
}

export interface Content {
  id: string
  title: string
  description: string | null
  content_url: string
  min_belt: Belt
  created_by: string | null
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  created_by: string | null
  created_at: string
  creator?: Profile
}
