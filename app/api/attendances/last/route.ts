import { NextResponse } from "next/server"
import { isAuthFailure, requireAdminProfile } from "@/lib/auth/api-auth"

export async function GET(request: Request) {
  const auth = await requireAdminProfile(request)
  if (isAuthFailure(auth)) return auth.response

  const supabase = auth.supabase

  // Fetch all students (role=student only)
  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("id, full_name, belt, degree")
    .eq("role", "student")

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 })
  }

  // Fetch last attendance for each student via aggregation
  // Using a single query to get the max date per student
  const { data: lastAttendances, error: attendancesError } = await supabase
    .from("attendances")
    .select("student_id, date")
    .order("date", { ascending: false })

  if (attendancesError) {
    return NextResponse.json({ error: attendancesError.message }, { status: 500 })
  }

  // Build a map of student_id -> last attendance date (first occurrence is latest due to ORDER BY date DESC)
  const lastAttendanceMap: Record<string, string> = {}
  for (const attendance of lastAttendances ?? []) {
    if (!lastAttendanceMap[attendance.student_id]) {
      lastAttendanceMap[attendance.student_id] = attendance.date
    }
  }

  const now = new Date()

  const result = (students ?? []).map((student) => {
    const lastDate = lastAttendanceMap[student.id] ?? null
    const daysSince = lastDate
      ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      id: student.id,
      full_name: student.full_name,
      belt: student.belt,
      degree: student.degree,
      lastAttendanceDate: lastDate,
      daysSinceLastAttendance: daysSince,
    }
  })

  return NextResponse.json(result)
}
