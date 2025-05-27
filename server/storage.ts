import {
  users, 
  categories,
  transactions,
  documents,
  exchangeRates,
  recurringTransactions,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type Document,
  type InsertDocument,
  type ExchangeRate,
  type InsertExchangeRate,
  type RecurringTransaction,
  type InsertRecurringTransaction,
  DEFAULT_CATEGORIES
} from "../shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  logLogin(userId: number, ip: string): Promise<void>;
  blacklistToken(userId: number, token: string): Promise<void>;
  
  // Category operations
  getCategories(userId: number): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  initializeDefaultCategories(userId: number): Promise<Category[]>;
  
  // Transaction operations
  getTransactions(userId: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Recurring Transaction operations
  getRecurringTransactions(userId: number): Promise<RecurringTransaction[]>;
  getRecurringTransactionById(id: number): Promise<RecurringTransaction | undefined>;
  createRecurringTransaction(recurringTransaction: InsertRecurringTransaction): Promise<RecurringTransaction>;
  updateRecurringTransaction(id: number, data: Partial<RecurringTransaction>): Promise<RecurringTransaction | undefined>;
  deleteRecurringTransaction(id: number): Promise<boolean>;
  processRecurringTransactions(): Promise<number>; // Returns number of transactions generated
  getRecentTransactions(userId: number, limit: number): Promise<Transaction[]>;
  getMonthlySpending(userId: number, currency?: string): Promise<number>;
  getMonthlyIncome(userId: number, currency?: string): Promise<number>;
  
  // Document operations
  getDocuments(userId: number): Promise<Document[]>;
  getDocumentById(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Exchange rate operations
  getExchangeRates(): Promise<ExchangeRate | undefined>;
  createOrUpdateExchangeRates(data: InsertExchangeRate): Promise<ExchangeRate>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private transactions: Map<number, Transaction>;
  private documents: Map<number, Document>;
  private exchangeRates: Map<number, ExchangeRate>;
  private recurringTransactions: Map<number, RecurringTransaction>;
  private loginLogs: Array<{userId: number, ip: string, timestamp: Date}> = [];
  private blacklistedTokens: Array<{userId: number, token: string, timestamp: Date}> = [];
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentTransactionId: number;
  private currentDocumentId: number;
  private currentExchangeRateId: number;
  private currentRecurringTransactionId: number;

  async logLogin(userId: number, ip: string): Promise<void> {
    this.loginLogs.push({
      userId,
      ip,
      timestamp: new Date()
    });
    console.log(`Logged login for user ${userId} from IP ${ip}`);
  }

  async blacklistToken(userId: number, token: string): Promise<void> {
    this.blacklistedTokens.push({
      userId,
      token,
      timestamp: new Date()
    });
    console.log(`Blacklisted token for user ${userId}`);
  }

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.documents = new Map();
    this.exchangeRates = new Map();
    this.recurringTransactions = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentTransactionId = 1;
    this.currentDocumentId = 1;
    this.currentExchangeRateId = 1;
    this.currentRecurringTransactionId = 1;
    
    // Initialize with mock exchange rates
    this.initializeExchangeRates();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      fullName: insertUser.fullName ?? null,
      preferredCurrency: insertUser.preferredCurrency ?? "USD",
      preferredLanguage: insertUser.preferredLanguage ?? "en"
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
      icon: insertCategory.icon ?? "tag",
      color: insertCategory.color ?? "#3B82F6"
    };
    this.categories.set(id, category);
    return category;
  }
  
  async initializeDefaultCategories(userId: number): Promise<Category[]> {
    const userCategories = await this.getCategories(userId);
    if (userCategories.length > 0) {
      return userCategories;
    }
    
    const createdCategories: Category[] = [];
    
    for (const defaultCategory of DEFAULT_CATEGORIES) {
      const category = await this.createCategory({
        ...defaultCategory,
        userId
      });
      createdCategories.push(category);
    }
    
    return createdCategories;
  }
  
  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: now,
      date: insertTransaction.date ?? now,
      categoryId: insertTransaction.categoryId ?? null,
      currency: insertTransaction.currency ?? "USD",
      notes: insertTransaction.notes ?? null,
      isIncome: insertTransaction.isIncome ?? 0,
      documentId: insertTransaction.documentId ?? null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = await this.getTransactionById(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }
  
  async getRecentTransactions(userId: number, limit: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }
  
  async getMonthlySpending(userId: number, currency = 'USD'): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return Array.from(this.transactions.values())
      .filter((transaction) => 
        transaction.userId === userId && 
        !transaction.isIncome &&
        new Date(transaction.date) >= firstDayOfMonth &&
        transaction.currency === currency
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  }
  
  async getMonthlyIncome(userId: number, currency = 'USD'): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return Array.from(this.transactions.values())
      .filter((transaction) => 
        transaction.userId === userId && 
        transaction.isIncome === 1 &&
        new Date(transaction.date) >= firstDayOfMonth &&
        transaction.currency === currency
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  }
  
  // Recurring Transaction methods
  async getRecurringTransactions(userId: number): Promise<RecurringTransaction[]> {
    return Array.from(this.recurringTransactions.values())
      .filter(rt => rt.userId === userId && rt.isActive);
  }

  async getRecurringTransactionById(id: number): Promise<RecurringTransaction | undefined> {
    return this.recurringTransactions.get(id);
  }

  async createRecurringTransaction(insertRecurringTransaction: InsertRecurringTransaction): Promise<RecurringTransaction> {
    const now = new Date();
    const recurringTransaction: RecurringTransaction = {
      id: this.currentRecurringTransactionId++,
      ...insertRecurringTransaction,
      isActive: true,
      startDate: insertRecurringTransaction.startDate || now,
      lastGeneratedDate: null,
      createdAt: now,
      categoryId: insertRecurringTransaction.categoryId ?? null,
      currency: insertRecurringTransaction.currency ?? "USD",
      notes: insertRecurringTransaction.notes ?? null,
      isIncome: insertRecurringTransaction.isIncome ?? 0,
      endDate: insertRecurringTransaction.endDate ?? null,
      dayOfWeek: insertRecurringTransaction.dayOfWeek ?? null,
      dayOfMonth: insertRecurringTransaction.dayOfMonth ?? null,
      customDays: insertRecurringTransaction.customDays ?? null
    };
    this.recurringTransactions.set(recurringTransaction.id, recurringTransaction);
    return recurringTransaction;
  }

  async updateRecurringTransaction(id: number, data: Partial<RecurringTransaction>): Promise<RecurringTransaction | undefined> {
    const existing = this.recurringTransactions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data };
    this.recurringTransactions.set(id, updated);
    return updated;
  }

  async deleteRecurringTransaction(id: number): Promise<boolean> {
    return this.recurringTransactions.delete(id);
  }

  async processRecurringTransactions(): Promise<number> {
    const now = new Date();
    let processedCount = 0;

    for (const rt of this.recurringTransactions.values()) {
      if (!rt.isActive) continue;
      
      const lastGenDate = rt.lastGeneratedDate ? new Date(rt.lastGeneratedDate) : new Date(rt.startDate);
      let datesToProcess: Date[] = [];
      
      // Generate dates based on frequency
      switch (rt.frequency) {
        case 'daily':
          datesToProcess = this.getCustomDates(lastGenDate, now, 1);
          break;
          
        case 'weekly':
          datesToProcess = this.getWeeklyDates(lastGenDate, now, rt.dayOfWeek || 1);
          break;
          
        case 'monthly':
          datesToProcess = this.getMonthlyDates(lastGenDate, now, rt.dayOfMonth || 1);
          break;
          
        case 'custom':
          if (rt.customDays) {
            datesToProcess = this.getCustomDates(lastGenDate, now, rt.customDays);
          }
          break;
      }
      
      // Filter out future dates and dates after endDate
      const validDates = datesToProcess.filter(date => 
        date <= now && 
        (!rt.endDate || date <= new Date(rt.endDate))
      );
      
      if (validDates.length > 0) {
        // Create transactions for each valid date
        for (const date of validDates) {
          await this.createTransaction({
            userId: rt.userId,
            description: rt.description,
            amount: rt.amount,
            date: date,
            categoryId: rt.categoryId,
            currency: rt.currency,
            notes: rt.notes,
            isIncome: rt.isIncome ? 1 : 0
          });
          processedCount++;
        }
        
        // Update last generated date
        const latestDate = new Date(Math.max(...validDates.map(d => d.getTime())));
        await this.updateRecurringTransaction(rt.id, { lastGeneratedDate: latestDate });
      }
    }
    
    return processedCount;
  }

  // Helper methods for date calculations
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getWeeklyDates(startDate: Date, endDate: Date, dayOfWeek: number = 1): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    // Find the next occurrence of the specified day of week
    while (current <= endDate) {
      if (current.getDay() === dayOfWeek && current > startDate) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }

  private getMonthlyDates(startDate: Date, endDate: Date, dayOfMonth: number = 1): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    
    // Move to the next month to avoid processing the start month
    current.setMonth(current.getMonth() + 1);
    
    while (current <= endDate) {
      // Handle months with fewer days than the target day
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      const targetDate = new Date(current.getFullYear(), current.getMonth(), targetDay);
      if (targetDate > startDate && targetDate <= endDate) {
        dates.push(new Date(targetDate));
      }
      
      // Move to the first day of the next month
      current.setMonth(current.getMonth() + 1);
      current.setDate(1);
    }
    
    return dates;
  }

  private getCustomDates(startDate: Date, endDate: Date, days: number): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);
    
    // Add the interval days to get to the next occurrence
    current.setDate(current.getDate() + days);
    
    // Add all occurrences until end date
    while (current <= endDate) {
      dates.push(new Date(current));
      current = new Date(current);
      current.setDate(current.getDate() + days);
    }
    
    return dates;
  }

  // Document methods
  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const document: Document = {
      id: this.currentDocumentId++,
      userId: insertDocument.userId,
      filename: insertDocument.filename,
      fileType: insertDocument.fileType,
      ocrData: insertDocument.ocrData ?? null,
      createdAt: new Date()
    };
    this.documents.set(document.id, document);
    return document;
  }

  // Exchange rate methods
  async getExchangeRates(): Promise<ExchangeRate | undefined> {
    // Return the most recent exchange rates
    const rates = Array.from(this.exchangeRates.values());
    return rates[rates.length - 1];
  }

  async createOrUpdateExchangeRates(data: InsertExchangeRate): Promise<ExchangeRate> {
    const exchangeRate: ExchangeRate = {
      id: this.currentExchangeRateId++,
      ...data,
      lastUpdated: new Date()
    };
    this.exchangeRates.set(exchangeRate.id, exchangeRate);
    return exchangeRate;
  }

  private initializeExchangeRates() {
    // Initialize with some default exchange rates
    this.createOrUpdateExchangeRates({
      baseCurrency: 'USD',
      rates: {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.27,
        CAD: 1.37,
        AUD: 1.57
      },
      lastUpdated: new Date()
    });
  }
}

import { db } from "./db";
import { and, eq, desc, gte, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async logLogin(userId: number, ip: string): Promise<void> {
    await db.execute(sql`INSERT INTO login_logs (user_id, ip_address) VALUES (${userId}, ${ip})`);
  }

  async blacklistToken(userId: number, token: string): Promise<void> {
    await db.execute(sql`INSERT INTO blacklisted_tokens (user_id, token) VALUES (${userId}, ${token})`);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }
  
  async initializeDefaultCategories(userId: number): Promise<Category[]> {
    const userCategories = await this.getCategories(userId);
    if (userCategories.length > 0) {
      return userCategories;
    }
    
    const createdCategories: Category[] = [];
    
    for (const defaultCategory of DEFAULT_CATEGORIES) {
      const category = await this.createCategory({
        ...defaultCategory,
        userId
      });
      createdCategories.push(category);
    }
    
    return createdCategories;
  }
  
  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }
  
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }
  
  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    const [deletedTransaction] = await db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();
    return !!deletedTransaction;
  }
  
  // Recurring Transaction methods
  async getRecurringTransactions(userId: number): Promise<RecurringTransaction[]> {
    return db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(desc(recurringTransactions.createdAt));
  }

  async getRecurringTransactionById(id: number): Promise<RecurringTransaction | undefined> {
    const [recurringTransaction] = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.id, id));
    return recurringTransaction;
  }

  async createRecurringTransaction(insertRecurringTransaction: InsertRecurringTransaction): Promise<RecurringTransaction> {
    const [recurringTransaction] = await db
      .insert(recurringTransactions)
      .values(insertRecurringTransaction)
      .returning();
    return recurringTransaction;
  }

  async updateRecurringTransaction(id: number, data: Partial<RecurringTransaction>): Promise<RecurringTransaction | undefined> {
    const [updatedRecurringTransaction] = await db
      .update(recurringTransactions)
      .set(data)
      .where(eq(recurringTransactions.id, id))
      .returning();
    return updatedRecurringTransaction;
  }

  async deleteRecurringTransaction(id: number): Promise<boolean> {
    const [deletedRecurringTransaction] = await db
      .delete(recurringTransactions)
      .where(eq(recurringTransactions.id, id))
      .returning();
    return !!deletedRecurringTransaction;
  }

  // This method will process all active recurring transactions that need to be generated
  async processRecurringTransactions(): Promise<number> {
    const allRecurringTransactions = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.isActive, true));
    
    let generatedCount = 0;
    const currentDate = new Date();
    
    for (const recurTrans of allRecurringTransactions) {
      // Determine the last generated date or use start date if none exists
      const lastGenDate = recurTrans.lastGeneratedDate || recurTrans.startDate;
      let nextDates: Date[] = [];
      
      // Calculate the next occurrence date(s) based on frequency
      switch (recurTrans.frequency) {
        case 'daily':
          // Check if we need to generate for today
          if (this.isSameDay(lastGenDate, currentDate)) continue;
          nextDates = [currentDate];
          break;
          
        case 'weekly':
          if (this.getDaysDifference(lastGenDate, currentDate) < 7) continue;
          // Generate all weekly occurrences since last generation
          nextDates = this.getWeeklyDates(lastGenDate, currentDate, recurTrans.dayOfWeek);
          break;
          
        case 'monthly':
          // Check if we're in a new month since last generation
          if (
            lastGenDate.getMonth() === currentDate.getMonth() && 
            lastGenDate.getFullYear() === currentDate.getFullYear()
          ) continue;
          
          // Generate monthly occurrences
          nextDates = this.getMonthlyDates(lastGenDate, currentDate, recurTrans.dayOfMonth || lastGenDate.getDate());
          break;
          
        case 'custom':
          if (!recurTrans.customDays) continue;
          // Check if enough days have passed since last generation
          if (this.getDaysDifference(lastGenDate, currentDate) < recurTrans.customDays) continue;
          
          // Generate all custom interval occurrences
          nextDates = this.getCustomDates(lastGenDate, currentDate, recurTrans.customDays);
          break;
      }
      
      // Filter out dates beyond the end date if one exists
      if (recurTrans.endDate) {
        nextDates = nextDates.filter(date => date <= recurTrans.endDate!);
      }
      
      // Generate the transactions for the calculated dates
      for (const nextDate of nextDates) {
        // Create the new transaction
        const newTransaction: InsertTransaction = {
          userId: recurTrans.userId,
          description: recurTrans.description,
          amount: recurTrans.amount,
          date: nextDate,
          categoryId: recurTrans.categoryId,
          currency: recurTrans.currency,
          notes: recurTrans.notes ? `${recurTrans.notes} (Recurring)` : '(Recurring)',
          isIncome: recurTrans.isIncome,
        };
        
        await this.createTransaction(newTransaction);
        generatedCount++;
      }
      
      // Update the last generated date if we created transactions
      if (nextDates.length > 0) {
        const lastGeneratedDate = new Date(Math.max(...nextDates.map(d => d.getTime())));
        await this.updateRecurringTransaction(recurTrans.id, { lastGeneratedDate });
      }
    }
    
    return generatedCount;
  }
  
  // Helper methods for date calculations
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private getWeeklyDates(startDate: Date, endDate: Date, dayOfWeek?: number | null): Date[] {
    const dates: Date[] = [];
    const targetDayOfWeek = dayOfWeek !== undefined && dayOfWeek !== null 
      ? dayOfWeek 
      : startDate.getDay();
    
    let currentDate = new Date(startDate);
    
    // Adjust to the next occurrence of the target day of week
    while (currentDate.getDay() !== targetDayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // If this is still before the start date, advance a week
    if (currentDate < startDate) {
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Add all weekly occurrences until end date
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return dates;
  }
  
  private getMonthlyDates(startDate: Date, endDate: Date, dayOfMonth: number): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    // Move forward to the first month after start date
    if (currentDate < startDate) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Add all monthly occurrences until end date
    while (currentDate <= endDate) {
      // Get the correct day, accounting for months with fewer days
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(dayOfMonth, daysInMonth);
      
      const occurrenceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), actualDay);
      
      if (occurrenceDate <= endDate && occurrenceDate > startDate) {
        dates.push(occurrenceDate);
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return dates;
  }
  
  private getCustomDates(startDate: Date, endDate: Date, days: number): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    
    // Add the number of custom days to get to the next occurrence
    currentDate.setDate(currentDate.getDate() + days);
    
    // Add all custom day occurrences until end date
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + days);
    }
    
    return dates;
  }
  
  async getRecentTransactions(userId: number, limit: number): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }
  
  async getMonthlySpending(userId: number, currency = 'USD'): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await db
      .select({
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isIncome, 0),
          gte(transactions.date, firstDayOfMonth),
          eq(transactions.currency, currency)
        )
      );
      
    return result[0]?.total || 0;
  }
  
  async getMonthlyIncome(userId: number, currency = 'USD'): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await db
      .select({
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.isIncome, 1),
          gte(transactions.date, firstDayOfMonth),
          eq(transactions.currency, currency)
        )
      );
      
    return result[0]?.total || 0;
  }
  
  // Document methods
  async getDocuments(userId: number): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }
  
  async getDocumentById(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }
  
  // Exchange rate methods
  async getExchangeRates(): Promise<ExchangeRate | undefined> {
    const [rate] = await db
      .select()
      .from(exchangeRates)
      .orderBy(desc(exchangeRates.lastUpdated))
      .limit(1);
    return rate;
  }
  
  async createOrUpdateExchangeRates(data: InsertExchangeRate): Promise<ExchangeRate> {
    // Try to update first
    const existing = await this.getExchangeRates();
    
    if (existing) {
      const [updated] = await db
        .update(exchangeRates)
        .set({
          ...data,
          lastUpdated: new Date()
        })
        .where(eq(exchangeRates.id, existing.id))
        .returning();
      return updated;
    }
    
    // Insert if no existing record
    const [created] = await db
      .insert(exchangeRates)
      .values({
        ...data,
        lastUpdated: new Date()
      })
      .returning();
    
    return created;
  }
}

// Use the DatabaseStorage implementation with PostgreSQL
export const storage = new MemStorage();
