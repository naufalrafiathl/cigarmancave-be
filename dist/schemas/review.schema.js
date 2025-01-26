"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetReviewsQuerySchema = exports.CreateReviewSchema = void 0;
const zod_1 = require("zod");
const scoreRange = (min, max) => zod_1.z.number().int().min(min).max(max).optional();
const CigarStrengthEnum = zod_1.z.enum([
    "MILD",
    "MILD_MEDIUM",
    "MEDIUM",
    "MEDIUM_FULL",
    "FULL",
]);
exports.CreateReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        cigarId: zod_1.z.number().int().positive(),
        duration: zod_1.z.number().int().min(1).max(300).optional(),
        strength: CigarStrengthEnum.optional(),
        constructionScore: scoreRange(0, 50),
        drawScore: scoreRange(0, 50),
        flavorScore: scoreRange(0, 50),
        burnScore: scoreRange(0, 50),
        impressionScore: scoreRange(0, 50),
        FirstThird: zod_1.z.array(zod_1.z.string()).default([]),
        SecondThird: zod_1.z.array(zod_1.z.string()).default([]),
        FinalThird: zod_1.z.array(zod_1.z.string()).default([]),
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
        notes: zod_1.z.string().optional(),
        buyAgain: zod_1.z.boolean().optional(),
        pairings: zod_1.z
            .array(zod_1.z.object({
            name: zod_1.z.string().min(1).max(255),
            type: zod_1.z.string().min(1).max(255),
            notes: zod_1.z.string().optional(),
        }))
            .optional(),
        images: zod_1.z.array(zod_1.z.string().url()).optional(),
    }),
});
exports.GetReviewsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cigarId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        userId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
//# sourceMappingURL=review.schema.js.map