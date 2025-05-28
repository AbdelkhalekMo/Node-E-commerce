import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { config } from "../lib/config.js";

// Cache for blacklisted tokens
const tokenBlacklist = new Set();

// Token validation helper
const validateToken = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }
  
  if (tokenBlacklist.has(token)) {
    throw new Error('Token is blacklisted');
  }
  
  try {
    return jwt.verify(token, config.ACCESS_TOKEN_SECRET);
  } catch (error) {
    console.error('Token validation error:', error.message);
    throw error;
  }
};

export const protectRoute = async (req, res, next) => {
  try {
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    
    const accessToken = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    console.log('Access token:', accessToken ? 'Token exists' : 'No token');

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    try {
      const decoded = validateToken(accessToken);
      console.log('Decoded token:', decoded);
      
      // Check token expiration with some buffer time
      const tokenExp = decoded.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      if (tokenExp - now < 300000) { // 5 minutes buffer
        // Token is about to expire, could implement token refresh here
        res.set('X-Token-Expiring', 'true');
      }

      const user = await User.findById(decoded.userId)
        .select("-password")
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        return res.status(401).json({ message: "User not found" });
      }

      console.log('User found:', user._id);

      if (user.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ message: "Token is invalid" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log('Token validation error:', error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Unauthorized - Access token expired" });
      }
      if (error.message === 'Token is blacklisted') {
        return res.status(401).json({ message: "Unauthorized - Token has been revoked" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    return res.status(401).json({ 
      message: "Unauthorized - Invalid access token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const adminRoute = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied - Admin only" });
  }

  next();
};

// Middleware for handling role-based access
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied - Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Helper function to blacklist a token (useful for logout)
export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  // Implement cleanup of old tokens after certain time
  setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000); // 24 hours
};
