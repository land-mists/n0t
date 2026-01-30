-- Run these commands in your Supabase SQL Editor to create the tables.

-- 1. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    date TEXT,
    color TEXT
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    "dueDate" TEXT, -- Quoted to preserve camelCase if preferred, or use snake_case mapping in code
    priority TEXT,
    status TEXT,
    color TEXT
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start TEXT,
    "end" TEXT, -- 'end' is a keyword, must be quoted
    "isRecurring" BOOLEAN,
    "isTaskLinked" BOOLEAN
);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (Since we are using Anon Key for a personal app)
-- WARNING: This makes your data public if someone has your Anon Key and URL. 
-- For a personal app hosted privately, this is often acceptable, but for production, implement User Auth.

CREATE POLICY "Allow public access to notes" ON notes FOR ALL USING (true);
CREATE POLICY "Allow public access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow public access to events" ON events FOR ALL USING (true);
