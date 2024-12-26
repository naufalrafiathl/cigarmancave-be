import { z } from "zod";

const scoreRange = (min: number, max: number) =>
  z.number().int().min(min).max(max).optional();

const CigarStrengthEnum = z.enum([
  "MILD",
  "MILD_MEDIUM",
  "MEDIUM",
  "MEDIUM_FULL",
  "FULL",
]);

export const CreateReviewSchema = z.object({
  body: z.object({
    cigarId: z.number().int().positive(),
    duration: z.number().int().min(1).max(300).optional(), // Duration in minutes, max 5 hours
    strength: CigarStrengthEnum.optional(),

    // General scores (1-5)
    constructionScore: scoreRange(1, 5),
    drawScore: scoreRange(1, 5),
    flavorScore: scoreRange(1, 5),
    burnScore: scoreRange(1, 5),
    impressionScore: scoreRange(1, 5),

    // Flavor profile scores (1-3)
    flavorPepperScore: scoreRange(0, 3),
    flavorChocolateScore: scoreRange(0, 3),
    flavorCreamyScore: scoreRange(0, 3),
    flavorLeatherScore: scoreRange(0, 3),
    flavorWoodyScore: scoreRange(0, 3),
    flavorEarthyScore: scoreRange(0, 3),
    flavorNuttyScore: scoreRange(0, 3),
    flavorSweetScore: scoreRange(0, 3),
    flavorFruityScore: scoreRange(0, 3),
    flavorGrassyScore: scoreRange(0, 3),
    flavorBerryScore: scoreRange(0, 3),
    flavorCoffeeScore: scoreRange(0, 3),
    flavorBittersScore: scoreRange(0, 3),

    notes: z.string().optional(),
    buyAgain: z.boolean().optional(),

    pairings: z
      .array(
        z.object({
          name: z.string().min(1).max(255),
          type: z.string().min(1).max(255),
          notes: z.string().optional(),
        })
      )
      .optional(),

    images: z.array(z.string().url()).optional(),
  }),
});

export const GetReviewsQuerySchema = z.object({
  query: z.object({
    cigarId: z.string().regex(/^\d+$/).transform(Number).optional(),
    userId: z.string().regex(/^\d+$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
