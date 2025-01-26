"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeedSchema = void 0;
const zod_1 = require("zod");
exports.GetFeedSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        sortBy: zod_1.z.enum(['recent', 'top', 'hot']).optional(),
        filterBy: zod_1.z.enum(['all', 'reviews', 'general']).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional()
    })
});
//# sourceMappingURL=feed.schema.js.map