-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50),
    location VARCHAR(255),
    main_category VARCHAR(100), -- Formerly listing_type
    sub_category VARCHAR(100),  -- Formerly category_slug
    image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, buyer_id, seller_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved Listings Table
CREATE TABLE IF NOT EXISTS saved_listings (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, listing_id)
);

-- Migration Helper (Safe to run if columns exist or not)
-- This ensures existing tables are updated to the new naming convention without wiping data
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='listing_type') THEN
        ALTER TABLE listings RENAME COLUMN listing_type TO main_category;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='category_slug') THEN
        ALTER TABLE listings RENAME COLUMN category_slug TO sub_category;
    END IF;
END $$;
