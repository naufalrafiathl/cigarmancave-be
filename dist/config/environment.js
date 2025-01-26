"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1, 'Database URL is required'),
    PORT: zod_1.z.string().default('3001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    AUTH0_DOMAIN: zod_1.z.string().min(1, 'Auth0 domain is required'),
    AUTH0_CLIENT_ID: zod_1.z.string().min(1, 'Auth0 client ID is required'),
    AUTH0_CLIENT_SECRET: zod_1.z.string().min(1, 'Auth0 client secret is required'),
    AUTH0_AUDIENCE: zod_1.z.string().min(1, 'Auth0 audience is required'),
    RAPIDAPI_KEY: zod_1.z.string().min(1, 'RapidAPI key is required'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
});
let environment;
try {
    const env = envSchema.parse(process.env);
    const AUTH0_ISSUER_BASE_URL = env.AUTH0_DOMAIN.startsWith('https://')
        ? env.AUTH0_DOMAIN
        : `https://${env.AUTH0_DOMAIN}`;
    exports.environment = environment = Object.assign(Object.assign({}, env), { AUTH0_ISSUER_BASE_URL });
}
catch (error) {
    console.error('\n❌ Invalid environment variables:', error);
    process.exit(1);
}
//# sourceMappingURL=environment.js.map