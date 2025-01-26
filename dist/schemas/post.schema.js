"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPostsQuerySchema = exports.UpdatePostSchema = exports.CreatePostSchema = void 0;
const zod_1 = require("zod");
exports.CreatePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(1000),
        imageUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
        reviewId: zod_1.z.number().int().positive().optional(),
    }),
});
exports.UpdatePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(1000),
    }),
});
exports.GetPostsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        userId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        reviewId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
//# sourceMappingURL=post.schema.js.map