"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const errors_1 = require("../errors");
const validateRequest = (schema) => {
    return async (req, _res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                next(new errors_1.ValidationError(error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                })).toString()));
            }
            else {
                next(error);
            }
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.middleware.js.map