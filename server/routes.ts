import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertTransactionSchema, 
  insertDocumentSchema 
} from "@shared/schema";
import { processDocument } from "./services/ocr";
import { convertCurrency } from "./services/currency";

// Create temp directory for uploads if it doesn't exist
const uploadDir = path.join(process.cwd(), "temp-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept only PDFs and images
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPEG, and PNG are allowed."));
    }
  },
});

// Session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "fintrackapp-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: false, // Set to false for development
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
      },
    })
  );

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Authentication routes
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Initialize default categories for the user
      await storage.initializeDefaultCategories(user.id);
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  apiRouter.get("/auth/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // User routes
  apiRouter.put("/user/preferences", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const { preferredCurrency, preferredLanguage } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        preferredCurrency,
        preferredLanguage
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Categories routes
  apiRouter.get("/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const categories = await storage.getCategories(userId);
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/categories", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId
      });
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Transactions routes
  apiRouter.get("/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const transactions = await storage.getTransactions(userId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.get("/transactions/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit as string) || 5;
      const transactions = await storage.getRecentTransactions(userId, limit);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/transactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.put("/transactions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const transactionId = parseInt(req.params.id);
      
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
      res.status(200).json(updatedTransaction);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.delete("/transactions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const transactionId = parseInt(req.params.id);
      
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const deleted = await storage.deleteTransaction(transactionId);
      if (deleted) {
        res.status(200).json({ message: "Transaction deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete transaction" });
      }
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Document upload and OCR routes
  apiRouter.post("/documents/upload", isAuthenticated, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const userId = req.session.userId;
      const file = req.file;
      
      // Process document with OCR
      const ocrResult = await processDocument(file.path);
      
      // Save document to storage
      const document = await storage.createDocument({
        userId,
        filename: file.originalname,
        fileType: file.mimetype,
        ocrData: ocrResult
      });
      
      // If transactions were extracted, save them
      if (ocrResult.transactions && ocrResult.transactions.length > 0) {
        for (const txn of ocrResult.transactions) {
          await storage.createTransaction({
            userId,
            description: txn.description || "OCR Extracted Transaction",
            amount: txn.amount,
            date: txn.date ? new Date(txn.date) : new Date(),
            currency: "USD", // Default currency
            isIncome: txn.isIncome ? 1 : 0,
            documentId: document.id
          });
        }
      }
      
      // Clean up temp file
      fs.unlinkSync(file.path);
      
      res.status(201).json({
        document,
        transactionsExtracted: ocrResult.transactions?.length || 0
      });
    } catch (error) {
      // Clean up temp file if exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  apiRouter.get("/documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const documents = await storage.getDocuments(userId);
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Currency conversion routes
  apiRouter.get("/currency/exchange-rates", async (_req: Request, res: Response) => {
    try {
      const rates = await storage.getExchangeRates();
      if (!rates) {
        return res.status(404).json({ message: "Exchange rates not found" });
      }
      res.status(200).json(rates);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/currency/convert", async (req: Request, res: Response) => {
    try {
      const { amount, from, to } = req.body;
      
      if (!amount || !from || !to) {
        return res.status(400).json({ message: "Amount, from currency, and to currency are required" });
      }
      
      const convertedAmount = await convertCurrency(amount, from, to);
      res.status(200).json({ amount: convertedAmount });
    } catch (error) {
      res.status(500).json({ message: "Currency conversion failed" });
    }
  });

  // Dashboard data routes
  apiRouter.get("/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currency = user.preferredCurrency;
      
      // Calculate financial summary
      const monthlySpending = await storage.getMonthlySpending(userId, currency);
      const monthlyIncome = await storage.getMonthlyIncome(userId, currency);
      
      // Simple calculation of savings rate
      const savingsRate = monthlyIncome > 0 
        ? Math.round(((monthlyIncome - monthlySpending) / monthlyIncome) * 100) 
        : 0;
      
      // Get recent transactions
      const recentTransactions = await storage.getRecentTransactions(userId, 5);
      
      res.status(200).json({
        summary: {
          monthlySpending,
          monthlyIncome,
          savingsRate,
          upcomingBills: 0  // Placeholder for future implementation
        },
        recentTransactions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
