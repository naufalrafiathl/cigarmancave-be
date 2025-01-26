"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = require("./config/environment");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const humidor_routes_1 = __importDefault(require("./routes/humidor.routes"));
const cigar_routes_1 = __importDefault(require("./routes/cigar.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const feed_routes_1 = __importDefault(require("./routes/feed.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const cigar_insights_routes_1 = __importDefault(require("./routes/cigar-insights.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const app = (0, express_1.default)();
const corsOptions = {
    origin: [environment_1.environment.FRONTEND_URL, "https://cigarmancave.us.auth0.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
};
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));
app.use((0, cors_1.default)(corsOptions));
app.use('/api/subscriptions/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
app.use("/api/auth", auth_routes_1.default);
app.use("/api/humidors", humidor_routes_1.default);
app.use("/api/cigars", cigar_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/api/posts", post_routes_1.default);
app.use('/api/feed', feed_routes_1.default);
app.use('/api/posts/:postId/comments', comment_routes_1.default);
app.use('/api/uploads', upload_routes_1.default);
app.use('/api/profile', profile_routes_1.default);
app.use('/api/cigars', cigar_insights_routes_1.default);
app.use('/api/achievements', achievement_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/subscriptions', subscription_routes_1.default);
app.use(error_middleware_1.errorHandler);
const PORT = environment_1.environment.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Auth0 issuer URL: ${environment_1.environment.AUTH0_ISSUER_BASE_URL}`);
    console.log(`Frontend URL: ${environment_1.environment.FRONTEND_URL}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map