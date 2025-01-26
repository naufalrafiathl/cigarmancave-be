"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuth0Token = void 0;
const express_jwt_1 = require("express-jwt");
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const environment_1 = require("./environment");
const AUTH0_DOMAIN = environment_1.environment.AUTH0_DOMAIN.replace('https://', '');
const jwksClient = jwks_rsa_1.default.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});
exports.validateAuth0Token = (0, express_jwt_1.expressjwt)({
    secret: jwksClient,
    audience: environment_1.environment.AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});
//# sourceMappingURL=auth.js.map