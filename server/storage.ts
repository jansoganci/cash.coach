import {
  users, 
  categories,
  transactions,
  documents,
  exchangeRates,
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

export const storage = new MemStorage();
