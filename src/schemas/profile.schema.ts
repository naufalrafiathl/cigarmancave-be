import { z } from "zod";

export const UpdateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(50).optional(),
    location: z.string().max(100).optional(),
    phoneNumber: z.string().regex(/^\+?[\d\s-]{8,20}$/, 'Invalid phone number format').optional(),
    badgeDisplayPreference: z.record(z.any()).optional()
  })
});

export const ImageUploadSchema = z.object({
  query: z.object({
    width: z.string().regex(/^\d+$/).transform(Number).optional(),
    height: z.string().regex(/^\d+$/).transform(Number).optional(),
    quality: z.string().regex(/^\d+$/).transform(Number).optional()
  })
});

export const BadgePreferencesSchema = z.object({
  body: z.record(z.any())
});