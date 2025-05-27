-- Create login_logs table to track user login attempts
CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraint if users table exists
  -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);

-- Create index for faster lookups by timestamp
CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp);
