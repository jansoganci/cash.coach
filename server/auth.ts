import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Secret key for signing JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || 'fintrack-jwt-secret-key-change-in-production';

// Token expiration (24 hours)
const TOKEN_EXPIRATION = '24h';

// Generate a JWT token for a user
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

// Verify the JWT token
export const verifyToken = (token: string): { id: number } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number };
  } catch (error) {
    return null;
  }
};

// Extract token from the Authorization header
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// Authentication middleware using JWT
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  
  if (!token) {
    console.log('No auth token found in request');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    console.log('Invalid or expired token');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = await storage.getUser(decoded.id);
  
  if (!user) {
    console.log(`User with ID ${decoded.id} not found`);
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Attach user to request object for use in route handlers
  (req as any).user = user;
  
  next();
};