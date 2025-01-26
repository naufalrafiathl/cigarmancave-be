"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBadgePreferencesSchema = exports.ImageUploadSchema = exports.UpdateProfileSchema = void 0;
const zod_1 = require("zod");
exports.UpdateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(50).optional(),
        location: zod_1.z.string().max(100).optional(),
        phoneNumber: zod_1.z.string().regex(/^\+?[\d\s-]{8,20}$/, 'Invalid phone number format').optional(),
        badgeDisplayPreference: zod_1.z.record(zod_1.z.any()).optional()
    })
});
exports.ImageUploadSchema = zod_1.z.object({
    query: zod_1.z.object({
        width: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        height: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        quality: zod_1.z.string().regex(/^\d+$/).transform(Number).optional()
    })
});
exports.UpdateBadgePreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        achievementIds: zod_1.z.array(zod_1.z.number())
            .min(0)
            .max(3, 'You can display up to 3 achievements'),
        displayOrder: zod_1.z.boolean().optional()
    })
});
//# sourceMappingURL=profile.schema.js.map