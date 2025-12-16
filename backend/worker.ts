import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Pool } from '@neondatabase/serverless';

// Types for Environment Variables (Set these in Cloudflare Dashboard)
type Bindings = {
  DATABASE_URL: string;
  R2_BUCKET: any;
  R2_PUBLIC_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for your Android App/Web App
app.use('/*', cors());

// --- Database Helper ---
const getDb = (url: string) => new Pool({ connectionString: url });

// --- Routes ---

app.get('/', (c) => c.text('Tumbi API is Running!'));

// 1. Get Listings
app.get('/api/listings', async (c) => {
    const pool = getDb(c.env.DATABASE_URL);
    // Join with users to get seller name
    const result = await pool.query(`
        SELECT l.*, u.name as seller_name, u.phone as seller_phone 
        FROM listings l 
        LEFT JOIN users u ON l.seller_id = u.id 
        ORDER BY l.created_at DESC
    `);
    
    // Map snake_case DB to camelCase JS
    const listings = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        price: parseFloat(row.price),
        unit: row.unit,
        location: row.location,
        category: row.category,
        type: row.type,
        description: row.description,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        sellerId: row.seller_id,
        sellerName: row.seller_name,
        sellerPhone: row.seller_phone,
        isVerified: row.is_verified
    }));
    
    return c.json(listings);
});

// 2. Create Listing
app.post('/api/listings', async (c) => {
    const body = await c.req.json();
    const pool = getDb(c.env.DATABASE_URL);
    
    // In real app, ensure User exists first
    await pool.query(`
        INSERT INTO listings (id, title, price, unit, location, category, type, description, image_url, seller_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [body.id, body.title, body.price, body.unit, body.location, body.category, body.type, body.description, body.imageUrl, body.sellerId]);
    
    return c.json({ success: true, id: body.id });
});

// 3. Get Messages
app.get('/api/messages', async (c) => {
    const listingId = c.req.query('listingId');
    const userId = c.req.query('userId');
    const otherId = c.req.query('otherId');
    
    const pool = getDb(c.env.DATABASE_URL);
    const result = await pool.query(`
        SELECT * FROM messages 
        WHERE listing_id = $1 
        AND ((sender_id = $2 AND receiver_id = $3) OR (sender_id = $3 AND receiver_id = $2))
        ORDER BY timestamp ASC
    `, [listingId, userId, otherId]);
    
    return c.json(result.rows.map(row => ({
        id: row.id,
        listingId: row.listing_id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        timestamp: row.timestamp
    })));
});

// 4. Send Message
app.post('/api/messages', async (c) => {
    const body = await c.req.json();
    const pool = getDb(c.env.DATABASE_URL);
    const id = crypto.randomUUID();
    
    await pool.query(`
        INSERT INTO messages (id, listing_id, sender_id, receiver_id, content, timestamp)
        VALUES ($1, $2, $3, $4, $5, NOW())
    `, [id, body.listingId, body.senderId, body.receiverId, body.content]);
    
    return c.json({ ...body, id });
});

// 5. Generate R2 Presigned URL (For Image Uploads)
app.post('/api/upload-url', async (c) => {
    const { filename, contentType } = await c.req.json();
    const key = `uploads/${crypto.randomUUID()}-${filename}`;
    
    // In a real Worker, use the R2 binding to generate a signed PUT URL
    // For this example, we'll return a dummy one or you implement the specific PutObjectCommand
    // const signedUrl = await getSignedUrl(c.env.R2_BUCKET, key...);
    
    // For now, returning structure:
    return c.json({
        uploadUrl: `https://fake-signed-url/${key}`, // You need AWS SDK v3 here for R2 signing
        publicUrl: `${c.env.R2_PUBLIC_URL}/${key}`
    });
});

export default app;