-- 1. DROP EXISTING TABLES (RECREATE FROM SCRATCH)
DROP TABLE IF EXISTS saved_listings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE TABLES WITH NEW COLUMN NAMES
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Changed: Removed NOT NULL to allow optional email
    phone VARCHAR(20) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50),
    location VARCHAR(255),
    main_category VARCHAR(100), 
    sub_category VARCHAR(100),  
    image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, buyer_id, seller_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE saved_listings (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, listing_id)
);
