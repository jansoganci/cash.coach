import { pgTable, text, serial, integer, timestamp, doublePrecision, json, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  preferredCurrency: text("preferred_currency").default("USD").notNull(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  icon: text("icon").default("tag"),
  color: text("color").default("#3B82F6"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  categoryId: integer("category_id"),
  currency: text("currency").default("USD").notNull(),
  notes: text("notes"),
  isIncome: integer("is_income").default(0).notNull(),
  documentId: integer("document_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Document model
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  ocrData: json("ocr_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

// Currency exchange rates
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: text("base_currency").notNull(),
  rates: json("rates").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
});

// Recurring Transaction model
export const recurringTransactions = pgTable("recurring_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  categoryId: integer("category_id"),
  currency: text("currency").default("USD").notNull(),
  notes: text("notes"),
  isIncome: integer("is_income").default(0).notNull(),
  
  // Recurrence specific fields
  frequency: varchar("frequency", { length: 20 }).notNull(), // daily, weekly, monthly, custom
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"), // nullable - if not set, recurs indefinitely
  dayOfWeek: integer("day_of_week"), // 0-6 for weekly recurrence (0 = Sunday)
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly recurrence
  customDays: integer("custom_days"), // For custom X days frequency
  lastGeneratedDate: timestamp("last_generated_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecurringTransactionSchema = createInsertSchema(recurringTransactions).omit({
  id: true,
  lastGeneratedDate: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertRecurringTransaction = z.infer<typeof insertRecurringTransactionSchema>;

// Default categories
export const DEFAULT_CATEGORIES = [
  { name: "Groceries", icon: "shopping-basket", color: "#3B82F6" },
  { name: "Dining", icon: "restaurant", color: "#F59E0B" },
  { name: "Transportation", icon: "car", color: "#10B981" },
  { name: "Entertainment", icon: "tv", color: "#8B5CF6" },
  { name: "Housing", icon: "home", color: "#EF4444" },
  { name: "Utilities", icon: "flash", color: "#6366F1" },
  { name: "Healthcare", icon: "first-aid", color: "#EC4899" },
  { name: "Shopping", icon: "shopping-bag", color: "#F97316" },
  { name: "Travel", icon: "plane", color: "#14B8A6" },
  { name: "Other", icon: "more", color: "#9CA3AF" },
];

// Supported currencies
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

// Supported languages
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "de", name: "German" },
];
