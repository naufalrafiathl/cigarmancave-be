import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Auth0
  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),
  
  // RapidAPI
  RAPIDAPI_KEY: z.string().min(1, 'RapidAPI key is required'),

  // Frontend
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

// Declare the environment variable outside the try block
let environment: z.infer<typeof envSchema> & { AUTH0_ISSUER_BASE_URL: string };

try {
  const env = envSchema.parse(process.env);
  
  const AUTH0_ISSUER_BASE_URL = env.AUTH0_DOMAIN.startsWith('https://') 
    ? env.AUTH0_DOMAIN 
    : `https://${env.AUTH0_DOMAIN}`;

  // Assign values instead of exporting
  environment = {
    ...env,
    AUTH0_ISSUER_BASE_URL,
  };
} catch (error) {
  console.error('\n❌ Invalid environment variables:', error);
  process.exit(1);
}

// Export at module level
export { environment };