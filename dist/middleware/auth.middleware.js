"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.validateAuth0Token = void 0;
const express_oauth2_jwt_bearer_1 = require("express-oauth2-jwt-bearer");
const environment_1 = require("../config/environment");
const errors_1 = require("../errors");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.validateAuth0Token = (0, express_oauth2_jwt_bearer_1.auth)({
    audience: environment_1.environment.AUTH0_AUDIENCE,
    issuerBaseURL: environment_1.environment.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: "RS256",
});
const authenticate = async (req, res, next) => {
    var _a, _b;
    try {
        await (0, exports.validateAuth0Token)(req, res, (err) => {
            if (err) {
                throw new errors_1.UnauthorizedError("Invalid token");
            }
        });
        const auth0Id = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.payload.sub;
        if (!auth0Id) {
            throw new errors_1.UnauthorizedError("User ID not found in token");
        }
        const user = await prisma.user.findUnique({
            where: { auth0Id: auth0Id },
        });
        if (!user) {
            const newUser = await prisma.user.create({
                data: {
                    auth0Id: auth0Id,
                    email: (_b = req.auth) === null || _b === void 0 ? void 0 : _b.payload.email,
                    badgeDisplayPreference: {},
                    emailVerified: false,
                    isPremium: false,
                },
            });
            req.user = { id: newUser.id };
        }
        else {
            req.user = { id: user.id };
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map