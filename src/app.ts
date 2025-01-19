import express from "express";
import cors from "cors";
import helmet from "helmet";
import { environment } from "./config/environment";
import authRoutes from "./routes/auth.routes";
import humidorRoutes from "./routes/humidor.routes";
import cigarRoutes from "./routes/cigar.routes";
import reviewRoutes from './routes/review.routes';
import postRoutes from './routes/post.routes';
import commentRoutes from './routes/comment.routes';
import feedRoutes from './routes/feed.routes';
import uploadRoutes from './routes/upload.routes'
import profileRoutes from './routes/profile.routes'
import cigarInsightsRoutes from './routes/cigar-insights.routes';
import achievementRoutes from './routes/achievement.routes';
import importRoutes from './routes/import.routes';
import subscriptionRoutes from './routes/subscription.routes';

import { errorHandler } from "./middleware/error.middleware";

const app = express();
const corsOptions = {
  origin: [environment.FRONTEND_URL, "https://cigarmancave.us.auth0.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
app.use(cors(corsOptions));

// Raw body parser for Stripe webhook
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// Other body parsers
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/humidors", humidorRoutes);
app.use("/api/cigars", cigarRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/posts", postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/cigars', cigarInsightsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/import', importRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use(errorHandler);

const PORT = environment.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth0 issuer URL: ${environment.AUTH0_ISSUER_BASE_URL}`);
  console.log(`Frontend URL: ${environment.FRONTEND_URL}`);
});

export default app;