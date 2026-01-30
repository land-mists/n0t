-- Run these commands in your Neon Console (SQL Editor) to create the necessary tables.

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
    duedate TEXT,
    priority TEXT,
    status TEXT,
    color TEXT
);

-- 3. Events Table
-- Note: start/end are reserved keywords in SQL sometimes, using start_time/end_time
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    isrecurring BOOLEAN,
    istasklinked BOOLEAN
);
