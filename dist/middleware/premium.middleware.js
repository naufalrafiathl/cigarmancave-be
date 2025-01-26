"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePremium = void 0;
const requirePremium = (req, res, next) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.isPremium)) {
        return res.status(403).json({
            status: 'error',
            message: 'Premium subscription required'
        });
    }
    next();
};
exports.requirePremium = requirePremium;
//# sourceMappingURL=premium.middleware.js.map