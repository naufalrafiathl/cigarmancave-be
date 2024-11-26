import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { environment } from './config/environment';
import authRoutes from './routes/auth.routes';
import humidorRoutes from './routes/humidor.routes'
import { errorHandler } from './middleware/error.middleware';

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    environment.FRONTEND_URL,
    'https://cigarmancave.us.auth0.com' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));
app.use(cors(corsOptions));
app.use(express.json());

// Auth0 specific headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/humidors', humidorRoutes);



// Error handling
app.use(errorHandler);

const PORT = environment.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Auth0 issuer URL: ${environment.AUTH0_ISSUER_BASE_URL}`);
  console.log(`Frontend URL: ${environment.FRONTEND_URL}`);
});

export default app;