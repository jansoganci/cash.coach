-- Migration: Create blacklisted_tokens table
-- Purpose: Store invalidated JWT tokens when a user logs out

-- Create the blacklisted_tokens table
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on token for faster lookup
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_token ON blacklisted_tokens(token);
