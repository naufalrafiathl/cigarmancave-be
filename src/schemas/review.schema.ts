import { z } from "zod";

const scoreRange = (min: number, max: number) => 
  z.number().int().min(min).max(max).optional();

export const CreateReviewSchema = z.object({
  body: z.object({
    cigarId: z.number().int().positive(),
    duration: z.number().int().min(1).max(300).optional(), // Duration in minutes, max 5 hours
    
    // General scores (1-5)
    constructionScore: scoreRange(1, 5),
    drawScore: scoreRange(1, 5),
    flavorScore: scoreRange(1, 5),
    burnScore: scoreRange(1, 5),
    impressionScore: scoreRange(1, 5),

    // Flavor profile scores (1-3)
    flavorPepperScore: scoreRange(1, 3),
    flavorChocolateScore: scoreRange(1, 3),
    flavorCreamyScore: scoreRange(1, 3),
    flavorLeatherScore: scoreRange(1, 3),
    flavorWoodyScore: scoreRange(1, 3),
    flavorEarthyScore: scoreRange(1, 3),
    flavorNuttyScore: scoreRange(1, 3),
    flavorSweetScore: scoreRange(1, 3),
    flavorFruityScore: scoreRange(1, 3),
    flavorGrassyScore: scoreRange(1, 3),
    flavorBerryScore: scoreRange(1, 3),
    flavorCoffeeScore: scoreRange(1, 3),
    flavorBittersScore: scoreRange(1, 3),

    notes: z.string().optional(),
    buyAgain: z.boolean().optional(),
    
    pairings: z.array(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(255),
        notes: z.string().optional(),
      })
    ).optional(),
    
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