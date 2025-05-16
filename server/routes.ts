import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { authenticateJWT, generateToken } from "./auth";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertTransactionSchema, 
  insertDocumentSchema,
  DEFAULT_CATEGORIES
} from "@shared/schema";
import { processDocument } from "./services/ocr";
import { convertCurrency, formatCurrency } from "./services/currency";

// Upload file settings
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = './temp-uploads';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.') as any, false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware to log API requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`${req.method} ${req.path}`);
    }
    next();
  });

  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Auth routes
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, fullName, preferredCurrency, preferredLanguage } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email is already registered
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName: fullName || null,
        preferredCurrency: preferredCurrency || 'USD',
        preferredLanguage: preferredLanguage || 'en'
      });
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      // Initialize default categories for the user
      await storage.initializeDefaultCategories(user.id);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = generateToken(user.id);
      
      console.log(`User ${user.username} logged in successfully`);
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    // With JWT, the client is responsible for removing the token
    res.status(200).json({ message: "Logged out successfully" });
  });

  apiRouter.get("/auth/me", authenticateJWT, async (req: Request, res: Response) => {
    try {
      // user is attached to req by authenticateJWT middleware
      const user = (req as any).user;
      
      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        preferredCurrency: user.preferredCurrency,
        preferredLanguage: user.preferredLanguage
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // User routes
  apiRouter.put("/user/preferences", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { preferredCurrency, preferredLanguage } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        preferredCurrency,
        preferredLanguage
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({
        preferredCurrency: updatedUser.preferredCurrency,
        preferredLanguage: updatedUser.preferredLanguage
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Categories routes
  apiRouter.get("/categories", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const categories = await storage.getCategories(userId);
      res.status(200).json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/categories", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId
      });
      
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Transaction routes
  apiRouter.get("/transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const transactions = await storage.getTransactions(userId);
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.get("/transactions/recent", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const transactions = await storage.getRecentTransactions(userId, limit);
      res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { isRecurring, frequency, endDate, dayOfWeek, dayOfMonth, customDays, ...rawTransactionData } = req.body;
      
      const transactionData = insertTransactionSchema.parse({
        ...rawTransactionData,
        userId,
        date: rawTransactionData.date ? new Date(rawTransactionData.date) : new Date(),
        isIncome: rawTransactionData.isIncome ? 1 : 0
      });
      
      // Create the regular transaction
      const newTransaction = await storage.createTransaction(transactionData);
      
      // If it's marked as recurring, also create a recurring transaction record
      if (isRecurring && frequency) {
        await storage.createRecurringTransaction({
          userId,
          description: transactionData.description,
          amount: transactionData.amount,
          categoryId: transactionData.categoryId,
          currency: transactionData.currency,
          notes: transactionData.notes,
          isIncome: transactionData.isIncome,
          frequency,
          startDate: transactionData.date,
          endDate: endDate ? new Date(endDate) : null,
          dayOfWeek: typeof dayOfWeek === 'number' ? dayOfWeek : null,
          dayOfMonth: typeof dayOfMonth === 'number' ? dayOfMonth : null,
          customDays: typeof customDays === 'number' ? customDays : null,
        });
      }
      
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.put("/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const transactionId = parseInt(req.params.id);
      
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this transaction" });
      }
      
      const updatedData = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : transaction.date,
        isIncome: req.body.isIncome !== undefined ? (req.body.isIncome ? 1 : 0) : transaction.isIncome
      };
      
      const updatedTransaction = await storage.updateTransaction(transactionId, updatedData);
      res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.delete("/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const transactionId = parseInt(req.params.id);
      
      const transaction = await storage.getTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (transaction.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this transaction" });
      }
      
      const success = await storage.deleteTransaction(transactionId);
      if (success) {
        res.status(200).json({ message: "Transaction deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete transaction" });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Document routes
  apiRouter.post("/documents/upload", authenticateJWT, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filePath = req.file.path;
      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      
      // Process the document with OCR
      console.log(`Processing document: ${filePath}`);
      const ocrResult = await processDocument(filePath);
      
      // Store document reference in the database
      const document = await storage.createDocument({
        userId,
        filename: fileName,
        fileType,
        ocrData: ocrResult
      });
      
      // Clean up temporary file
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting temporary file: ${err}`);
      });
      
      res.status(201).json({
        id: document.id,
        filename: document.filename,
        fileType: document.fileType,
        ocrData: ocrResult,
        extractedTransactions: ocrResult.transactions || []
      });
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.get("/documents", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const documents = await storage.getDocuments(userId);
      res.status(200).json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Currency routes
  apiRouter.get("/currency/exchange-rates", async (_req: Request, res: Response) => {
    try {
      const exchangeRates = await storage.getExchangeRates();
      res.status(200).json(exchangeRates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.post("/currency/convert", async (req: Request, res: Response) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
      const formattedAmount = formatCurrency(convertedAmount, toCurrency);
      
      res.status(200).json({
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        convertedCurrency: toCurrency,
        formattedAmount
      });
    } catch (error) {
      console.error("Error converting currency:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Dashboard data
  apiRouter.get("/dashboard", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currency = user.preferredCurrency;
      
      // Get monthly spending and income
      const monthlySpending = await storage.getMonthlySpending(userId, currency);
      const monthlyIncome = await storage.getMonthlyIncome(userId, currency);
      
      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlySpending) / monthlyIncome) * 100 : 0;
      
      // Get recent transactions
      const recentTransactions = await storage.getRecentTransactions(userId, 5);
      
      // Get categories
      const categories = await storage.getCategories(userId);
      
      // Mock upcoming bills for demo
      const upcomingBills = 350; // This would normally be calculated from recurring transactions
      
      res.status(200).json({
        monthlySpending,
        monthlyIncome,
        savingsRate,
        recentTransactions,
        categories,
        upcomingBills
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Recurring Transactions routes
  apiRouter.get("/recurring-transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const recurringTransactions = await storage.getRecurringTransactions(userId);
      res.status(200).json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.get("/recurring-transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      
      const recurringTransaction = await storage.getRecurringTransactionById(id);
      
      if (!recurringTransaction) {
        return res.status(404).json({ message: "Recurring transaction not found" });
      }
      
      if (recurringTransaction.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this recurring transaction" });
      }
      
      res.status(200).json(recurringTransaction);
    } catch (error) {
      console.error("Error fetching recurring transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.delete("/recurring-transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      
      const recurringTransaction = await storage.getRecurringTransactionById(id);
      
      if (!recurringTransaction) {
        return res.status(404).json({ message: "Recurring transaction not found" });
      }
      
      if (recurringTransaction.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this recurring transaction" });
      }
      
      const success = await storage.deleteRecurringTransaction(id);
      if (success) {
        res.status(200).json({ message: "Recurring transaction deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete recurring transaction" });
      }
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  apiRouter.put("/recurring-transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      
      const recurringTransaction = await storage.getRecurringTransactionById(id);
      
      if (!recurringTransaction) {
        return res.status(404).json({ message: "Recurring transaction not found" });
      }
      
      if (recurringTransaction.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this recurring transaction" });
      }
      
      // Only allow updating certain fields
      const { 
        description, amount, categoryId, currency, notes, isIncome,
        frequency, endDate, dayOfWeek, dayOfMonth, customDays, isActive
      } = req.body;
      
      const updatedData: Partial<RecurringTransaction> = {};
      
      if (description !== undefined) updatedData.description = description;
      if (amount !== undefined) updatedData.amount = amount;
      if (categoryId !== undefined) updatedData.categoryId = categoryId;
      if (currency !== undefined) updatedData.currency = currency;
      if (notes !== undefined) updatedData.notes = notes;
      if (isIncome !== undefined) updatedData.isIncome = isIncome ? 1 : 0;
      if (frequency !== undefined) updatedData.frequency = frequency;
      if (endDate !== undefined) updatedData.endDate = endDate ? new Date(endDate) : null;
      if (dayOfWeek !== undefined) updatedData.dayOfWeek = dayOfWeek;
      if (dayOfMonth !== undefined) updatedData.dayOfMonth = dayOfMonth;
      if (customDays !== undefined) updatedData.customDays = customDays;
      if (isActive !== undefined) updatedData.isActive = isActive;
      
      const updated = await storage.updateRecurringTransaction(id, updatedData);
      res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Trigger processing of recurring transactions (could be called by a cron job in production)
  apiRouter.post("/recurring-transactions/process", authenticateJWT, async (req: Request, res: Response) => {
    try {
      // Only allow admins to trigger this in a real app
      const count = await storage.processRecurringTransactions();
      res.status(200).json({ 
        message: `Successfully processed recurring transactions`,
        transactionsGenerated: count
      });
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Financial Health Snapshot API endpoint
  apiRouter.get("/financial-health", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currency = user.preferredCurrency;
      
      // Get monthly spending and income
      const monthlySpending = await storage.getMonthlySpending(userId, currency);
      const monthlyIncome = await storage.getMonthlyIncome(userId, currency);
      
      // Get user's transactions
      const transactions = await storage.getTransactions(userId);
      
      // Get categories for category matching
      const categories = await storage.getCategories(userId);
      
      // Calculate debt-to-income ratio
      // Normally we would fetch this from credit accounts and loans
      // This is a simplified calculation using recurring payments marked as debt
      const debtPayments = transactions
        .filter(t => {
          // Get category name from the category ID if available
          if (t.categoryId) {
            const category = categories.find(c => c.id === t.categoryId);
            const categoryName = category?.name?.toLowerCase() || '';
            return categoryName.includes('debt') || categoryName.includes('loan');
          }
          return false;
        })
        .reduce((total, t) => total + (t.isIncome ? 0 : t.amount), 0);
      
      const debtToIncomeRatio = monthlyIncome > 0 ? 
        Math.min(1, debtPayments / monthlyIncome) : 0.5;
      
      // Calculate savings rate
      const savingsRate = monthlyIncome > 0 ? 
        Math.max(0, Math.min(1, (monthlyIncome - monthlySpending) / monthlyIncome)) : 0;
      
      // Calculate emergency fund status (comparing savings to 6 months of expenses)
      // Ideally this would use actual savings account data
      const savingsTransactions = transactions
        .filter(t => {
          if (t.categoryId) {
            const category = categories.find(c => c.id === t.categoryId);
            const categoryName = category?.name?.toLowerCase() || '';
            return categoryName.includes('saving');
          }
          return false;
        })
        .reduce((total, t) => total + (t.isIncome ? t.amount : -t.amount), 0);
      
      const sixMonthsExpenses = monthlySpending * 6;
      const emergencyFundStatus = sixMonthsExpenses > 0 ? 
        Math.min(1, savingsTransactions / sixMonthsExpenses) : 0;
      
      // Calculate expense ratio (expenses / income)
      const expenseRatio = monthlyIncome > 0 ? 
        Math.min(1, monthlySpending / monthlyIncome) : 0.7;
      
      // Calculate investment diversity
      // This is simplified - would normally check different asset classes
      const investmentCategories = new Set(
        transactions
          .filter(t => {
            if (t.categoryId) {
              const category = categories.find(c => c.id === t.categoryId);
              const categoryName = category?.name?.toLowerCase() || '';
              return categoryName.includes('invest');
            }
            return false;
          })
          .map(t => t.categoryId)
      );
      
      const investmentDiversity = Math.min(1, investmentCategories.size / 5);
      
      res.status(200).json({
        debtToIncomeRatio,
        savingsRate,
        emergencyFundStatus,
        expenseRatio,
        investmentDiversity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching financial health data:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });

  // Let Vite handle static files and client-side routing
  app.use("*", (req, res, next) => {
    // Only handle API routes, let Vite handle the rest
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }
    
    // For non-API routes, Vite will handle serving the app
    next();
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}