import { z } from "zod";

export const CreatePostSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
    imageUrls: z.array(z.string().url()).optional(),
    reviewId: z.number().int().positive().optional(),
  }),
});

export const UpdatePostSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(1000),
  }),
});

export const GetPostsQuerySchema = z.object({
  query: z.object({
    userId: z.string().regex(/^\d+$/).transform(Number).optional(),
    reviewId: z.string().regex(/^\d+$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});