import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); // <-- COMMENT THIS LINE OUT

// Configuration with fallbacks
export const config = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGO_URI || "mongodb+srv://AbdelkhalekMo:Abdelkhalek%40123@cluster0.fquxhea.mongodb.net/Ecommerce?retryWrites=true&w=majority&appName=Cluster0",
  jwtSecret: process.env.JWT_SECRET || "a4f8c3e7b2d9f6g5h1j2k3l4m5n6p7q8r9s0t1u2v3w4x5y6z7",
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "please_set_access_token_secret_in_env",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "please_set_refresh_token_secret_in_env",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  cookieExpire: process.env.COOKIE_EXPIRE || 7,
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigin: process.env.ALLOWED_ORIGIN || "http://localhost:4201",
  clientUrl: process.env.CLIENT_URL || "http://localhost:4201",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "sk_test_51O8c6HSJYyKlQEDFZCXweSvnUCvwQVMOxA7RRwOjK31H6La4L6HQDlGwq9Bfo99N8FMzKJAMgIoXsYDaJwPE3KQY00ORurNu5Z"
}; 