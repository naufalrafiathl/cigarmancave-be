import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  AUTH0_DOMAIN: z.string().min(1, 'Auth0 domain is required'),
  AUTH0_CLIENT_ID: z.string().min(1, 'Auth0 client ID is required'),
  AUTH0_CLIENT_SECRET: z.string().min(1, 'Auth0 client secret is required'),
  AUTH0_AUDIENCE: z.string().min(1, 'Auth0 audience is required'),
  
  RAPIDAPI_KEY: z.string().min(1, 'RapidAPI key is required'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

let environment: z.infer<typeof envSchema> & { AUTH0_ISSUER_BASE_URL: string };

try {
  const env = envSchema.parse(process.env);
  
  const AUTH0_ISSUER_BASE_URL = env.AUTH0_DOMAIN.startsWith('https://') 
    ? env.AUTH0_DOMAIN 
    : `https://${env.AUTH0_DOMAIN}`;

  environment = {
    ...env,
    AUTH0_ISSUER_BASE_URL,
  };
} catch (error) {
  console.error('\n❌ Invalid environment variables:', error);
  process.exit(1);
}

export { environment };