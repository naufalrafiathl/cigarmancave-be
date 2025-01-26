"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const base_error_1 = require("../errors/base.error");
const library_1 = require("@prisma/client/runtime/library");
const zod_1 = require("zod");
const moderation_service_1 = require("../services/moderation.service");
const errorHandler = (err, _req, res, _next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }
    if (err instanceof moderation_service_1.ModerationError) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            details: {
                moderationId: err.moderationId,
                violations: err.violations.map(violation => ({
                    type: violation.contentType,
                    categories: violation.flaggedCategories.map(cat => ({
                        name: cat.category,
                        confidence: `${(cat.score * 100).toFixed(2)}%`,
                        appliedTo: cat.appliedInputTypes
                    })),
                    content: violation.originalContent
                }))
            }
        });
        return;
    }
    if (err instanceof base_error_1.AppError) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        return;
    }
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        res.status(400).json({
            status: 'error',
            message: 'Database operation failed',
            code: err.code
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.errors
        });
        return;
    }
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development'
            ? err instanceof Error ? err.message : 'Unknown error'
            : 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map