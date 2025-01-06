import { z } from "zod";

export const CreateHumidorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const UpdateHumidorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
  }),
});

export const AddCigarToHumidorSchema = z.object({
  body: z.object({
    cigarId: z.number().int().positive(),
    quantity: z.number().int().positive(),
    purchasePrice: z.number().optional(),
    purchaseDate: z.string().datetime(),
    purchaseLocation: z.string().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(), 
  }),
});

export const UpdateHumidorCigarSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive().optional(),
    purchasePrice: z.number().optional(),
    purchaseDate: z.string().datetime().optional(),
    purchaseLocation: z.string().optional(),
    notes: z.string().optional(),
  }),
});