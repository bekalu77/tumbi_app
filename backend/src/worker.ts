import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

// Define the environment bindings
// These are set in your Cloudflare dashboard (or wrangler.toml for local dev)
type Bindings = {
    DATABASE_URL: string;
    JWT_SECRET: string;
    R2_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Bindings }>();

// --- MIDDLEWARE ---
app.use('/*', cors()); // Enable CORS for all routes

// Auth middleware to protect routes
app.use('/api/*', async (c, next) => {
    // Allow public access for registration, login, and viewing listings
    if (
        c.req.path === '/api/register' ||
        c.req.path === '/api/login' ||
        (c.req.path === '/api/listings' && c.req.method === 'GET')
    ) {
        return next();
    }

    // For all other routes, require a valid token
    const authHeader = c.req.header('x-access-token');
    if (!authHeader) {
        return c.json({ auth: false, message: 'No token provided.' }, 401);
    }

    try {
        const decoded = await verify(authHeader, c.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            throw new Error("Invalid token payload");
        }

        const pool = new Pool({ connectionString: c.env.DATABASE_URL });
        const { rows } = await pool.query('SELECT id, name, email, location, phone FROM users WHERE id = $1', [decoded.id]);
        const user = rows[0];

        if (!user) {
            return c.json({ auth: false, message: 'User not found.' }, 401);
        }

        c.set('jwtPayload', user); // Pass user to the next middleware
        await next();
    } catch (err) {
        return c.json({ auth: false, message: 'Your session is invalid. Please log in again.' }, 401);
    }
});


// --- DATABASE HELPERS (to be refactored) ---
// In a real app, you'd abstract this logic, but for a single file, this is okay.


// --- AUTH ROUTES ---

app.post('/api/register', async (c) => {
    const body = await c.req.json();
    const { name, email, phone, password, location } = body;

    if (!name || !email || !password) {
        return c.json({ message: 'Name, email, and password are required' }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const result = await pool.query(
            'INSERT INTO users (name, email, phone, password, location) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, location',
            [name, email, phone, hashedPassword, location]
        );
        const user = result.rows[0];
        const token = await sign({ id: user.id }, c.env.JWT_SECRET);

        return c.json({ auth: true, token, user });
    } catch (error: any) {
        console.error("Registration Error:", error.message);
        if (error.message.includes('users_email_key')) { // Unique constraint violation
             return c.json({ message: 'An account with this email already exists.' }, 409);
        }
        return c.json({ message: 'Error registering user', error: error.message }, 500);
    }
});

app.post('/api/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
        return c.json({ message: 'Email and password are required' }, 400);
    }

    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];

        if (!user) {
            return c.json({ message: 'User not found' }, 404);
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return c.json({ auth: false, token: null, message: 'Invalid password' }, 401);
        }

        const token = await sign({ id: user.id }, c.env.JWT_SECRET);
        
        // Don't send the password back to the client
        const { password: _, ...userWithoutPassword } = user;

        return c.json({ auth: true, token, user: userWithoutPassword });
    } catch (error: any) {
        return c.json({ message: 'Error logging in', error: error.message }, 500);
    }
});


// --- IMAGE UPLOAD ROUTE ---

app.post('/api/upload', async (c) => {
    const formData = await c.req.formData();
    const photos = formData.getAll('photos');
    const user = c.get('jwtPayload');

    if (!photos || photos.length === 0) {
        return c.json({ message: 'No files were uploaded.' }, 400);
    }

    const filePaths: string[] = [];
    const url = new URL(c.req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    for (const photo of photos) {
        if (photo && typeof (photo as any).arrayBuffer === 'function') {
            const f = photo as any;
            const uniqueName = `${(user as any).id}-${Date.now()}-${f.name}`;
            try {
                await c.env.R2_BUCKET.put(uniqueName, await f.arrayBuffer(), {
                    httpMetadata: { contentType: f.type },
                });
                const publicUrl = `${baseUrl}/uploads/${uniqueName}`;
                filePaths.push(publicUrl);
            } catch (err: any) {
                console.error('R2 Upload Error:', err.message);
                return c.json({ message: 'Failed to upload one or more files.' }, 500);
            }
        }
    }

    return c.json({ message: 'Files uploaded successfully', urls: filePaths });
});

// Serve uploaded files from R2
app.get('/uploads/:key', async (c) => {
    const key = c.req.param('key');
    const object = await c.env.R2_BUCKET.get(key);

    if (object === null) {
        return c.notFound();
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, {
        headers,
    });
});


// --- LISTINGS ROUTES ---

app.get('/api/listings', async (c) => {
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });
    try {
        const result = await pool.query(`
            SELECT
                l.id, l.title, l.price, l.unit, l.location,
                l.category_slug as "category",
                l.listing_type as "listingType",
                l.description, l.image_url as "imageUrls",
                l.created_at as "createdAt",
                l.user_id as "sellerId",
                u.name as "sellerName", u.phone as "sellerPhone",
                l.is_verified as "isVerified"
            FROM listings l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
        `);

        const listings = result.rows.map(item => ({
            ...item,
            price: parseFloat(item.price), // Ensure price is a number
            imageUrls: item.imageUrls ? item.imageUrls.split(',') : [],
            isVerified: !!item.isVerified
        }));

        return c.json(listings);
    } catch (error: any) {
        console.error("Listing fetch error:", error.message);
        return c.json({ message: "Failed to fetch listings", error: error.message }, 500);
    }
});

app.post('/api/listings', async (c) => {
    const user = c.get('jwtPayload');
    const body = await c.req.json();
    const { title, price, unit, location, category, listingType, description, imageUrls } = body;

    if (!title || price === undefined || !unit || !location || !category || !listingType || !description || !imageUrls) {
        return c.json({ message: "All fields are required to create a listing." }, 400);
    }

    const imageUrlsString = imageUrls.join(',');
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const result = await pool.query(
            'INSERT INTO listings (title, price, unit, location, category_slug, listing_type, description, image_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [title, price, unit, location, category, listingType, description, imageUrlsString, (user as any).id]
        );
        return c.json({ message: 'Listing created successfully!', listingId: result.rows[0].id }, 201);
    } catch (error: any) {
        console.error("CRITICAL: Error creating listing:", error);
        return c.json({ message: 'A server error occurred while creating the listing.', error: error.message }, 500);
    }
});

app.put('/api/listings/:id', async (c) => {
    const user = c.get('jwtPayload');
    const listingId = c.req.param('id');
    const body = await c.req.json();
    const { title, price, unit, location, category, listingType, description, imageUrls } = body;

    if (!title || price === undefined || !unit || !location || !category || !listingType || !description || !imageUrls) {
        return c.json({ message: "All fields are required to update a listing." }, 400);
    }

    const imageUrlsString = imageUrls.join(',');
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const result = await pool.query(
            'UPDATE listings SET title = $1, price = $2, unit = $3, location = $4, category_slug = $5, listing_type = $6, description = $7, image_url = $8 WHERE id = $9 AND user_id = $10 RETURNING id',
            [title, price, unit, location, category, listingType, description, imageUrlsString, listingId, (user as any).id]
        );

        if (result.rowCount === 0) {
            return c.json({ message: "Listing not found or you don't have permission to edit it." }, 404);
        }

        return c.json({ message: 'Listing updated successfully!', listingId: result.rows[0].id });
    } catch (error: any) {
        console.error("CRITICAL: Error updating listing:", error);
        return c.json({ message: 'A server error occurred while updating the listing.', error: error.message }, 500);
    }
});


// --- CHAT ROUTES ---

app.post('/api/conversations', async (c) => {
    const user = c.get('jwtPayload');
    const { listingId } = await c.req.json();
    const buyerId = (user as any).id;

    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const listingResult = await pool.query('SELECT user_id FROM listings WHERE id = $1', [listingId]);
        const listing = listingResult.rows[0];
        if (!listing) return c.json({ message: 'Listing not found' }, 404);
        
        const sellerId = listing.user_id;
        if (buyerId === sellerId) return c.json({ message: "You cannot start a conversation with yourself." }, 400);

        let conversationResult = await pool.query('SELECT * FROM conversations WHERE listing_id = $1 AND buyer_id = $2', [listingId, buyerId]);
        let conversation = conversationResult.rows[0];

        if (!conversation) {
            const result = await pool.query('INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING *', [listingId, buyerId, sellerId]);
            conversation = result.rows[0];
        }

        return c.json(conversation);
    } catch (error: any) {
        return c.json({ message: 'Failed to create or get conversation', error: error.message }, 500);
    }
});

app.get('/api/conversations', async (c) => {
    const user = c.get('jwtPayload');
    const userId = (user as any).id;
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const conversationsResult = await pool.query(`
            SELECT 
                c.id as "conversationId",
                l.id as "listingId", l.title as "listingTitle", l.image_url as "listingImage",
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as "lastMessage",
                (SELECT timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as "lastMessageDate",
                CASE WHEN c.buyer_id = $1 THEN seller.name ELSE buyer.name END as "otherUserName",
                CASE WHEN c.buyer_id = $1 THEN seller.id ELSE buyer.id END as "otherUserId"
            FROM conversations c
            JOIN listings l ON c.listing_id = l.id
            JOIN users buyer ON c.buyer_id = buyer.id
            JOIN users seller ON c.seller_id = seller.id
            WHERE c.buyer_id = $1 OR c.seller_id = $1
            ORDER BY "lastMessageDate" DESC
        `, [userId]);

        const conversations = conversationsResult.rows.map(c => ({
            ...c,
            listingImage: c.listingImage ? c.listingImage.split(',')[0] : null,
        }));

        return c.json(conversations);
    } catch (error: any) {
        return c.json({ message: 'Failed to fetch conversations', error: error.message }, 500);
    }
});

app.get('/api/conversations/:id/messages', async (c) => {
    const conversationId = c.req.param('id');
    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const messages = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC', [conversationId]);
        return c.json(messages.rows);
    } catch (error: any) {
        return c.json({ message: 'Failed to fetch messages', error: error.message }, 500);
    }
});

app.post('/api/messages', async (c) => {
    const user = c.get('jwtPayload');
    const senderId = (user as any).id;
    const { conversationId, receiverId, content } = await c.req.json();

    if (!conversationId || !receiverId || !content) {
        return c.json({ message: "Missing required fields" }, 400);
    }

    const pool = new Pool({ connectionString: c.env.DATABASE_URL });

    try {
        const result = await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING id',
            [conversationId, senderId, receiverId, content]
        );
        return c.json({ message: 'Message sent', messageId: result.rows[0].id }, 201);
    } catch (error: any) {
        return c.json({ message: 'Failed to send message', error: error.message }, 500);
    }
});


export default app;
