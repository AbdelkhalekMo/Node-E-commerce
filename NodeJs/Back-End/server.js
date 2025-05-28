import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import { fileURLToPath } from 'url';
import { config } from "./lib/config.js";

// For ESM dirname compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log configuration to debug
console.log("Loaded configuration:");
console.log("PORT:", config.port);
console.log("JWT_SECRET:", config.jwtSecret ? "***defined***" : "undefined");
console.log("STRIPE_SECRET_KEY:", config.stripeSecretKey ? "***defined***" : "undefined");

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import usersRoutes from "./routes/users.route.js";
import orderRoutes from "./routes/order.route.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = config.port;

// Basic rate limiting
const rateLimit = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!rateLimit[ip]) {
    rateLimit[ip] = {
      requests: 1,
      windowStart: now
    };
  } else {
    if (now - rateLimit[ip].windowStart > WINDOW_MS) {
      rateLimit[ip] = {
        requests: 1,
        windowStart: now
      };
    } else if (rateLimit[ip].requests > MAX_REQUESTS) {
      return res.status(429).json({ message: 'Too many requests' });
    } else {
      rateLimit[ip].requests++;
    }
  }
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS configuration
const allowedDevOrigins = [
    /^http:\/\/localhost:\d+$/,
    'http://localhost:4200',
    'http://localhost:4201'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    console.log('Request origin:', origin);

    if (config.nodeEnv === "production") {
      if (config.allowedOrigin === origin) {
        return callback(null, true);
      } else {
        return callback(new Error('CORS policy violation for production'));
      }
    } else { // Development mode
      if (allowedDevOrigins.some(regex => typeof regex === 'string' ? regex === origin : regex.test(origin))) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS policy violation for development. Origin: ${origin}`));
      }
    }
  },
  credentials: true
}));

// Body parser with request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Configure cookies for cross-origin requests
app.use((req, res, next) => {
  // Store the original cookie method
  const originalCookie = res.cookie;
  
  // Override the cookie method
  res.cookie = function(name, value, options = {}) {
    // Set default cookie options for cross-origin requests
    options.sameSite = options.sameSite || 'lax';  // Use 'none' in production with HTTPS
    options.path = options.path || '/';
    
    // In production, cookies should be secure
    if (config.nodeEnv === 'production') {
      options.secure = options.secure !== undefined ? options.secure : true;
      options.sameSite = 'none';
    }
    
    // Call the original cookie method with our modified options
    return originalCookie.call(res, name, value, options);
  };
  next();
});

// Request logging in development
if (config.nodeEnv !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/orders", orderRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: config.nodeEnv === "production" ? "Internal server error" : err.message
  });
});

// Serve static files in production
if (config.nodeEnv === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
