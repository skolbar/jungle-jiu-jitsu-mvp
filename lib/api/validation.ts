import "server-only"

import { NextResponse } from "next/server"
import { z } from "zod"

export const uuidSchema = z.string().uuid()
export const beltSchema = z.enum(["white", "blue", "purple", "brown", "black"])
export const roleSchema = z.enum(["student", "admin"])
export const checkInStatusSchema = z.enum(["approved", "rejected"])

export const degreeSchema = z.coerce.number().int().min(0).max(4)
export const classQuantitySchema = z.coerce.number().int().min(1).max(500)

const trimmedString = (max: number) => z.string().trim().min(1).max(max)

export const createUserSchema = z.object({
  full_name: trimmedString(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(6).max(128),
  belt: beltSchema,
  degree: degreeSchema.default(0),
  role: roleSchema.default("student"),
})

export const legacyStudentCreateSchema = z.object({
  name: trimmedString(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  belt: beltSchema,
  degree: degreeSchema.default(0),
  classCount: z.coerce.number().int().min(0).max(10000).default(0),
})

export const legacyStudentUpdateSchema = legacyStudentCreateSchema.extend({
  id: uuidSchema,
})

export const studentPatchSchema = z
  .object({
    full_name: trimmedString(120).optional(),
    belt: beltSchema.optional(),
    degree: degreeSchema.optional(),
    reset_cycle_classes: z.boolean().optional().default(false),
  })
  .refine((value) => value.full_name !== undefined || value.belt !== undefined || value.degree !== undefined, {
    message: "At least one field must be provided",
  })

export const addClassesSchema = z.object({
  quantity: classQuantitySchema,
})

export const createAttendanceSchema = z.object({
  studentId: uuidSchema,
  date: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: "Invalid date",
    }),
})

export const checkInDecisionSchema = z.object({
  id: uuidSchema,
  status: checkInStatusSchema,
})

export const bulkCheckInDecisionSchema = z.object({
  status: checkInStatusSchema,
})

export const announcementCreateSchema = z.object({
  title: trimmedString(160),
  message: trimmedString(5000),
})

export const contentCreateSchema = z.object({
  title: trimmedString(160),
  description: z.string().trim().max(1000).optional().default(""),
  type: trimmedString(50),
  url: z.string().trim().url().max(2048),
  required_belt: beltSchema,
  required_degree: degreeSchema.default(0),
  module_slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/i),
  category: trimmedString(80),
})

export const profileUpdateSchema = z
  .object({
    full_name: trimmedString(120).optional(),
    avatar_url: z.string().trim().url().max(2048).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  })

export const passwordUpdateSchema = z.object({
  newPassword: z.string().min(6).max(128),
})

const optionalUrl = z.union([z.string().trim().url().max(2048), z.literal("")]).optional().transform((value) => value || null)

export const partnerPayloadSchema = z.object({
  name: trimmedString(120),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: trimmedString(80),
  description: z.string().trim().max(2000).default(""),
  logo_url: optionalUrl,
  cover_url: optionalUrl,
  gallery_urls: z.array(z.string().trim().url().max(2048)).max(6).default([]),
  benefit_title: z.string().trim().max(160).default(""),
  benefit_description: z.string().trim().max(1000).default(""),
  coupon_code: z.string().trim().max(80).optional().transform((value) => value || null),
  whatsapp_url: optionalUrl,
  instagram_url: optionalUrl,
  website_url: optionalUrl,
  address: z.string().trim().max(300).optional().transform((value) => value || null),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().int().min(0).max(100000).default(0),
  valid_until: z.union([z.string().trim().date(), z.literal("")]).optional().transform((value) => value || null),
})

export const studentPasswordResetSchema = z.object({
  newPassword: z.string().min(6).max(128),
})

export const beltLockSchema = z.object({
  belt: beltSchema,
  degree: degreeSchema,
})

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<{ data: z.infer<TSchema> } | { response: NextResponse }> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return { response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return {
      response: NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    }
  }

  return { data: parsed.data }
}
