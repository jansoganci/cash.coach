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
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
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
  
  private currentUserId: number;
  private currentCategoryId: number;
  private currentTransactionId: number;
  private currentDocumentId: number;
  private currentExchangeRateId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.transactions = new Map();
    this.documents = new Map();
    this.exchangeRates = new Map();
    
    this.currentUserId = 1;
    this.currentCategoryId = 1;
    this.currentTransactionId = 1;
    this.currentDocumentId = 1;
    this.currentExchangeRateId = 1;
    
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
      createdAt: now
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
      id
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
      createdAt: now
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
  
  // Document methods
  async getDocuments(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter((document) => document.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getDocumentById(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: now
    };
    this.documents.set(id, document);
    return document;
  }
  
  // Exchange rate methods
  async getExchangeRates(): Promise<ExchangeRate | undefined> {
    // Always return the first exchange rate
    return this.exchangeRates.get(1);
  }
  
  async createOrUpdateExchangeRates(data: InsertExchangeRate): Promise<ExchangeRate> {
    const now = new Date();
    const id = 1; // Always use the same ID to replace the existing record
    const exchangeRate: ExchangeRate = {
      ...data,
      id,
      lastUpdated: now
    };
    this.exchangeRates.set(id, exchangeRate);
    return exchangeRate;
  }
  
  private initializeExchangeRates() {
    this.createOrUpdateExchangeRates({
      baseCurrency: 'USD',
      rates: {
        EUR: 0.92,
        GBP: 0.79,
        JPY: 151.67,
        CNY: 7.24,
        USD: 1.0
      },
      lastUpdated: new Date()
    });
  }
}

import { db } from "./db";
import { and, eq, desc, gte, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
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
export const storage = new DatabaseStorage();
