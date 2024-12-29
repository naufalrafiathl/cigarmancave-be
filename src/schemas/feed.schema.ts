import { z } from 'zod';

export const GetFeedSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(['recent', 'top', 'hot']).optional(),
    filterBy: z.enum(['all', 'reviews', 'general']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
});