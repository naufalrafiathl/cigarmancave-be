"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = void 0;
const base_error_1 = require("./base.error");
class BadRequestError extends Error {
    constructor(errorInfo) {
        const message = typeof errorInfo === 'string' ? errorInfo : errorInfo.message;
        super(message);
        if (typeof errorInfo !== 'string') {
            this.details = errorInfo.details;
        }
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends base_error_1.AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends base_error_1.AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends base_error_1.AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends base_error_1.AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends base_error_1.AppError {
    constructor(message = 'Validation Error') {
        super(message, 422);
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=http.error.js.map