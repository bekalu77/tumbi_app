
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME, R2_PUBLIC_URL } from './r2-config.js';
import dotenv from 'dotenv';

dotenv.config();

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Neon database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Middleware to authenticate and add user to request
const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, message: "No token provided." });

    jwt.verify(token as string, JWT_SECRET, async (err: any, decoded: any) => {
        if (err) return res.status(401).json({ auth: false, message: "Your session is invalid. Please log in again." });
        
        const client = await pool.connect();
        try {
            const userResult = await client.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
            const user = userResult.rows[0];
            if (!user) return res.status(401).json({ auth: false, message: "User not found. Please log in again." });
            req.user = user; // Add user to the request object
            next();
        } finally {
            client.release();
        }
    });
};


// --- Auth Endpoints ---

app.post('/api/register', async (req, res) => {
    const { name, email, phone, password, location } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ message: 'Name, email, phone, and password are required' });
    
    const client = await pool.connect();
    try {
        // Check for redundant email or phone
        const existingUser = await client.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
        if (existingUser.rows.length > 0) {
            const user = existingUser.rows[0];
            if (user.email === email) {
                return res.status(409).json({ message: 'This email is already registered.' });
            }
            if (user.phone === phone) {
                return res.status(409).json({ message: 'This phone number is already registered.' });
            }
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const result = await client.query('INSERT INTO users (name, email, phone, password, location) VALUES ($1, $2, $3, $4, $5) RETURNING id', [name, email, phone, hashedPassword, location]);
        const user = { id: result.rows[0].id, name, email, phone, location };
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 });
        res.status(201).json({ auth: true, token, user });
    } catch (error: any) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    } finally {
        client.release();
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const client = await pool.connect();
    try {
        const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ auth: false, token: null, message: 'Invalid password' });
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: 86400 });
        delete user.password;
        res.status(200).json({ auth: true, token, user });
    } catch (error: any) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    } finally {
        client.release();
    }
});

// --- User Profile Endpoints ---
app.put('/api/users/me', authenticateToken, async (req: any, res) => {
    const { name, email, location } = req.body;
    const userId = req.user.id;

    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });

    const client = await pool.connect();
    try {
        // Check if email is already taken by another user
        const existingEmail = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (existingEmail.rows.length > 0) {
            return res.status(409).json({ message: 'This email is already in use by another account.' });
        }

        await client.query('UPDATE users SET name = $1, email = $2, location = $3 WHERE id = $4', [name, email, location, userId]);
        res.json({ message: 'Profile updated successfully!' });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    } finally {
        client.release();
    }
});

// --- Image Upload Endpoint ---
app.post('/api/upload', authenticateToken, async (req: any, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const files = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];
    const filePaths: string[] = [];

    for (const file of files) {
        const uniqueName = `${Date.now()}-${file.name}`;
        
        try {
            await r2.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: uniqueName,
                Body: file.data,
                ContentType: file.mimetype,
            }));
            filePaths.push(`${R2_PUBLIC_URL}/${uniqueName}`);
        } catch (err) {
            console.error('Error uploading to R2:', err);
            return res.status(500).json({ message: 'Failed to upload file.', error: err });
        }
    }

    res.json({ message: 'Files uploaded successfully', urls: filePaths });
});


// --- Listings Endpoints ---

app.get('/api/listings', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(`
        SELECT
        l.id,
        l.title,
        l.price,
        l.unit,
        l.location,
        l.category_slug as "category",
        l.listing_type as "listingType", 
        l.description,
        l.image_url as "imageUrls",
        l.created_at as "createdAt",
        l.user_id as "sellerId",
        u.name as "sellerName",
        u.phone as "sellerPhone",
        l.is_verified as "isVerified"
        FROM listings l
        LEFT JOIN users u ON l.user_id = u.id
    `);
    
    const listings = result.rows;
    res.json(listings.map(item => ({
        ...item,
        imageUrls: item.imageUrls ? item.imageUrls.split(',') : [], 
        isVerified: !!item.isVerified
    })));

  } catch (error: any) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings", error: error.message });
  } finally {
      client.release();
  }
});

app.post('/api/listings', authenticateToken, async (req: any, res) => {
    const { title, price, unit, location, category, listingType, description, imageUrls } = req.body;
    const userId = req.user.id;
    
    if (!title || price === undefined || !unit || !location || !category || !listingType || !description || !imageUrls) {
        return res.status(400).json({ message: "All fields are required to create a listing." });
    }

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ message: "You must upload at least one image." });
    }

    const imageUrlsString = imageUrls.join(',');
    const client = await pool.connect();
    try {
        const result = await client.query('INSERT INTO listings (title, price, unit, location, category_slug, listing_type, description, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id', [title, price, unit, location, category, listingType, description, imageUrlsString, userId]);
        res.status(201).json({ message: 'Listing created successfully!', listingId: result.rows[0].id });
    
    } catch (error: any) {
        console.error("CRITICAL: Error creating listing:", error)
        res.status(500).json({ message: 'A server error occurred while creating the listing.', error: error.message });
    } finally {
        client.release();
    }
});

app.delete('/api/listings/:id', authenticateToken, async (req: any, res) => {
    const listingId = req.params.id;
    const userId = req.user.id;
    const client = await pool.connect();
    try {
        const result = await client.query('DELETE FROM listings WHERE id = $1 AND user_id = $2', [listingId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Listing not found or unauthorized' });
        res.json({ message: 'Listing deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete listing', error: error.message });
    } finally {
        client.release();
    }
});

app.put('/api/listings/:id', authenticateToken, async (req: any, res) => {
    const listingId = req.params.id;
    const userId = req.user.id;
    const { title, price, unit, location, category, listingType, description, imageUrls } = req.body;
    
    if (!title || price === undefined || !unit || !location || !category || !listingType || !description || !imageUrls) {
        return res.status(400).json({ message: "All fields are required to update a listing." });
    }

    const imageUrlsString = Array.isArray(imageUrls) ? imageUrls.join(',') : imageUrls;
    const client = await pool.connect();
    try {
        const result = await client.query('UPDATE listings SET title = $1, price = $2, unit = $3, location = $4, category_slug = $5, listing_type = $6, description = $7, image_url = $8 WHERE id = $9 AND user_id = $10', [title, price, unit, location, category, listingType, description, imageUrlsString, listingId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Listing not found or unauthorized' });
        res.json({ message: 'Listing updated successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update listing', error: error.message });
    } finally {
        client.release();
    }
});

// --- Chat Endpoints ---

app.post('/api/conversations', authenticateToken, async (req: any, res) => {
    const { listingId } = req.body;
    const buyerId = req.user.id;
    const client = await pool.connect();
    try {
        const listingResult = await client.query('SELECT user_id FROM listings WHERE id = $1', [listingId]);
        const listing = listingResult.rows[0];
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        const sellerId = listing.user_id;
        if (buyerId === sellerId) return res.status(400).json({ message: "You cannot start a conversation with yourself." });
        let conversationResult = await client.query('SELECT * FROM conversations WHERE listing_id = $1 AND buyer_id = $2', [listingId, buyerId]);
        let conversation = conversationResult.rows[0];
        if (!conversation) {
            const result = await client.query('INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id', [listingId, buyerId, sellerId]);
            conversation = { id: result.rows[0].id, listing_id: listingId, buyer_id: buyerId, seller_id: sellerId };
        }
        res.status(200).json(conversation);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to create or get conversation', error: error.message });
    } finally {
        client.release();
    }
});

app.get('/api/conversations', authenticateToken, async (req: any, res) => {
    const userId = req.user.id;
    const client = await pool.connect();
    try {
        const conversationsResult = await client.query(`
            SELECT 
                c.id as "conversationId",
                l.id as "listingId",
                l.title as "listingTitle",
                l.image_url as "listingImage",
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as "lastMessage",
                (SELECT "timestamp" FROM messages WHERE conversation_id = c.id ORDER BY "timestamp" DESC LIMIT 1) as "lastMessageDate",
                CASE
                    WHEN c.buyer_id = $1 THEN seller.name
                    ELSE buyer.name
                END as "otherUserName",
                 CASE
                    WHEN c.buyer_id = $1 THEN seller.id
                    ELSE buyer.id
                END as "otherUserId"
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            JOIN users buyer ON c.buyer_id = buyer.id
            JOIN users seller ON c.seller_id = seller.id
            WHERE c.buyer_id = $1 OR c.seller_id = $1
            ORDER BY "lastMessageDate" DESC
        `, [userId]);
        
        const conversations = conversationsResult.rows;
        res.json(conversations.map((c: any) => ({
            ...c,
            listingImage: c.listingImage ? c.listingImage.split(',')[0] : null
        })));

    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
    } finally {
        client.release();
    }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req: any, res) => {
    const conversationId = req.params.id;
    const client = await pool.connect();
    try {
        const messagesResult = await client.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC', [conversationId]);
        const messages = messagesResult.rows;
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
    } finally {
        client.release();
    }
});

app.post('/api/messages', authenticateToken, async (req: any, res) => {
    const senderId = req.user.id;
    const { conversationId, receiverId, content } = req.body;

    if (!conversationId || !receiverId || !content) return res.status(400).json({ message: "Missing required fields" });
    const client = await pool.connect();
    try {
        const result = await client.query('INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING id', [conversationId, senderId, receiverId, content]);
        res.status(201).json({ message: 'Message sent', messageId: result.rows[0].id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to send message', error: error.message });
    } finally {
        client.release();
    }
});


app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
});
