"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHumidorCigarSchema = exports.AddCigarToHumidorSchema = exports.UpdateHumidorSchema = exports.CreateHumidorSchema = void 0;
const zod_1 = require("zod");
exports.CreateHumidorSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        description: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().url().optional(),
    }),
});
exports.UpdateHumidorSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        description: zod_1.z.string().optional(),
    }),
});
exports.AddCigarToHumidorSchema = zod_1.z.object({
    body: zod_1.z.object({
        cigarId: zod_1.z.number().int().positive(),
        quantity: zod_1.z.number().int().positive(),
        purchasePrice: zod_1.z.number().optional(),
        purchaseDate: zod_1.z.string().datetime(),
        purchaseLocation: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().url().optional(),
    }),
});
exports.UpdateHumidorCigarSchema = zod_1.z.object({
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().positive().optional(),
        purchasePrice: zod_1.z.number().optional(),
        purchaseDate: zod_1.z.string().datetime().optional(),
        purchaseLocation: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=humidor.schema.js.map