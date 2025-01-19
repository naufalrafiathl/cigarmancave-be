import { z } from "zod";

export const CreateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500),
    parentId: z.number().int().positive().optional(),
  }),
  params: z.object({
    postId: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const UpdateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500),
  }),
  params: z.object({
    postId: z.string().regex(/^\d+$/).transform(Number),
    commentId: z.string().regex(/^\d+$/).transform(Number),
  }),
});

export const GetCommentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    parentId: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
  params: z.object({
    postId: z.string().regex(/^\d+$/).transform(Number),
  }),
});