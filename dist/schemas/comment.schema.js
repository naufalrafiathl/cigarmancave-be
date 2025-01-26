"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCommentsQuerySchema = exports.UpdateCommentSchema = exports.CreateCommentSchema = void 0;
const zod_1 = require("zod");
exports.CreateCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500),
        parentId: zod_1.z.number().int().positive().optional(),
    }),
    params: zod_1.z.object({
        postId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
exports.UpdateCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1).max(500),
    }),
    params: zod_1.z.object({
        postId: zod_1.z.string().regex(/^\d+$/).transform(Number),
        commentId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
exports.GetCommentsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        parentId: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
    params: zod_1.z.object({
        postId: zod_1.z.string().regex(/^\d+$/).transform(Number),
    }),
});
//# sourceMappingURL=comment.schema.js.map