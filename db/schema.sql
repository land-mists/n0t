-- Run these commands in your PlanetScale console.

-- 1. Notes Table
CREATE TABLE IF NOT EXISTS `notes` (
    `id` VARCHAR(255) PRIMARY KEY,
    `title` TEXT NOT NULL,
    `content` TEXT,
    `date` VARCHAR(255),
    `color` VARCHAR(50)
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
    `id` VARCHAR(255) PRIMARY KEY,
    `title` TEXT NOT NULL,
    `description` TEXT,
    `dueDate` VARCHAR(255),
    `priority` VARCHAR(50),
    `status` VARCHAR(50),
    `color` VARCHAR(50)
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS `events` (
    `id` VARCHAR(255) PRIMARY KEY,
    `title` TEXT NOT NULL,
    `description` TEXT,
    `start` VARCHAR(255),
    `end` VARCHAR(255),
    `isRecurring` BOOLEAN,
    `isTaskLinked` BOOLEAN
);
