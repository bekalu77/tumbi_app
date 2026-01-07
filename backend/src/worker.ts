import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

type Bindings = {
    DATABASE_URL: string;
    JWT_SECRET: string;
    R2_BUCKET: R2Bucket;
    R2_PUBLIC_URL: string;
    ADMIN_PHONE: string;
    TELEGRAM_BOT_TOKEN: string;
}

type Variables = {
    user: any;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const TELEGRAM_CHATS = [
    { id: '-1002512924994', name: '@tumbi_app' },
    { id: '-1002192283161', name: '@tumbi_conmart' }
];

// --- HELPERS ---
async function postToTelegram(listing: any, env: Bindings) {
    if (!env.TELEGRAM_BOT_TOKEN) return;

    const firstImage = listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null;
    const shareUrl = `https://tumbi.app/?listing=${listing.share_slug || listing.id}`;
    
    const caption = `
🚀 *New Listing on Tumbi*

*${listing.title}*
💰 *Price:* ${listing.price} ETB ${listing.unit ? `/ ${listing.unit}` : ''}
📍 *Location:* ${listing.location}
📞 *Contact:* ${listing.contact_phone || 'Contact via App'}

📝 *Description:*
${listing.description ? (listing.description.length > 150 ? listing.description.substring(0, 150) + '...' : listing.description) : 'No description provided.'}

🔗 *View Details:* [Click Here](${shareUrl})

#Tumbi #${listing.main_category?.replace(/[^a-zA-Z0-9]/g, '')} #Ethiopia
    `.trim();

    for (const chat of TELEGRAM_CHATS) {
        try {
            const endpoint = firstImage ? 'sendPhoto' : 'sendMessage';
            const body: any = {
                chat_id: chat.id,
                parse_mode: 'Markdown',
            };

            if (firstImage) {
                body.photo = firstImage;
                body.caption = caption;
            } else {
                body.text = caption;
            }

            await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (e) {
            console.error(`Telegram Post Error (${chat.name}):`, e);
        }
    }
}

function normalizePhoneForStorage(phone: any): string {
    const phoneStr = String(phone || '').trim();
    if (!phoneStr) return '';
    let clean = phoneStr.replace(/[^\d]/g, ''); 
    if (clean.length === 10 && clean.startsWith('0')) return '+251' + clean.substring(1);
    if (clean.length === 12 && clean.startsWith('251')) return '+' + clean;
    if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('7'))) return '+251' + clean;
    return phoneStr; 
}

function getLoginVariants(input: any): string[] {
    const inputStr = String(input || '').trim();
    if (!inputStr) return [];
    const clean = inputStr.replace(/\D/g, ''); 
    const variants = new Set<string>();
    
    if (inputStr.length >= 9) variants.add(inputStr);
    
    let base = '';
    if (clean.length === 10 && clean.startsWith('0')) base = clean.substring(1);
    else if (clean.length === 12 && clean.startsWith('251')) base = clean.substring(3);
    else if (clean.length === 9) base = clean;

    if (base) {
        variants.add(base);
        variants.add('0' + base);
        variants.add('251' + base);
        variants.add('+251' + base);
    }
    return Array.from(variants).filter(v => v.length >= 9);
}

function validateUsername(name: string): boolean {
    return /^[a-zA-Z0-9. ]+$/.test(name);
}

function generateShareSlug(title: string, id: number): string {
    const cleanTitle = title.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${cleanTitle}-${id}`;
}

// --- MIDDLEWARE ---
app.use('/*', cors({
  origin: '*', 
  allowHeaders: ['Content-Type', 'x-access-token', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.onError((err, c) => {
  console.error(`Worker Error: ${err.message}`);
  return c.json({ message: err.message || 'Internal Server Error' }, 500);
});

// Auth Middleware
app.use('/api/*', async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;

    const isPublic = 
        (path === '/api/register' && method === 'POST') ||
        (path === '/api/login' && method === 'POST') ||
        (path === '/api/listings' && method === 'GET') ||
        (path === '/api/upload' && method === 'POST') || 
        (path.match(/^\/api\/listings\/\d+$/) && method === 'GET') ||
        (path.match(/^\/api\/share\/[a-z0-9-]+$/) && method === 'GET') || 
        method === 'OPTIONS';

    if (isPublic) return await next();

    const authHeader = c.req.header('x-access-token');
    if (!authHeader) return c.json({ message: 'No token provided' }, 401);

    try {
        const decoded = await verify(authHeader, c.env.JWT_SECRET);
        const sql = neon(c.env.DATABASE_URL);
        const users = await sql`SELECT id, name, email, phone, location, company_name as "companyName", profile_image as "profileImage", is_verified as "isVerified" FROM users WHERE id = ${parseInt(decoded.id as string)}`;
        if (!users.length) return c.json({ message: 'User not found' }, 401);
        
        const userData = users[0];
        const isAdmin = c.env.ADMIN_PHONE && (userData.phone === c.env.ADMIN_PHONE || getLoginVariants(userData.phone).includes(c.env.ADMIN_PHONE));
        
        c.set('user', { ...userData, id: String(userData.id), isAdmin });
        return await next();
    } catch (err) {
        return c.json({ message: 'Invalid session' }, 401);
    }
});

// --- AUTH ---
app.post('/api/register', async (c) => {
    try {
        const { name, email, phone, password, location, companyName, profileImage } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        
        if (!name || !phone || !password) {
            return c.json({ message: 'Name, phone, and password are required' }, 400);
        }

        if (!validateUsername(name)) {
            return c.json({ message: 'Username can only contain letters, numbers, spaces, and dots (.)' }, 400);
        }

        const normPhone = normalizePhoneForStorage(phone);
        const variants = getLoginVariants(phone);
        const cleanEmail = (email && String(email).trim() !== '') ? String(email).trim().toLowerCase() : null;
        
        if (variants.length > 0) {
            const phoneExisting = await sql`SELECT id FROM users WHERE phone = ANY(${variants}) OR phone = ${normPhone}`;
            if (phoneExisting && phoneExisting.length > 0) {
                return c.json({ message: `Phone number ${phone} is already in use.` }, 409);
            }
        }

        if (cleanEmail) {
            const emailExisting = await sql`SELECT id FROM users WHERE email IS NOT NULL AND LOWER(email) = ${cleanEmail}`;
            if (emailExisting && emailExisting.length > 0) {
                return c.json({ message: `Email ${cleanEmail} is already in use.` }, 409);
            }
        }
        
        const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
        const result = await sql`
            INSERT INTO users (name, email, phone, password, location, company_name, profile_image) 
            VALUES (${name}, ${cleanEmail}, ${normPhone}, ${hashedPassword}, ${location}, ${companyName || null}, ${profileImage || null}) 
            RETURNING id
        `;
        
        const token = await sign({ id: String(result[0].id) }, c.env.JWT_SECRET);
        return c.json({ 
            auth: true, 
            token, 
            user: { id: String(result[0].id), name, email: cleanEmail, phone: normPhone, location, companyName, profileImage } 
        });
    } catch (e: any) {
        return c.json({ message: `Registration failed: ${e.message}` }, 500);
    }
});

app.post('/api/login', async (c) => {
    try {
        const body = await c.req.json();
        const password = String(body.password || '').trim();
        const input = String(body.identifier || body.email || body.phone || '').trim();
        if (!input || !password) return c.json({ message: 'Missing credentials' }, 400);
        
        const sql = neon(c.env.DATABASE_URL);
        const variants = getLoginVariants(input);
        const rows = await sql`
            SELECT id, name, email, phone, location, password, company_name as "companyName", profile_image as "profileImage", is_verified as "isVerified" FROM users 
            WHERE (email IS NOT NULL AND LOWER(email) = LOWER(${input})) 
               OR phone = ANY(${variants})
        `;
        
        if (rows.length === 0) return c.json({ message: 'Account not found' }, 401);
        
        const user = rows[0];
        if (!(await bcrypt.compare(password, user.password))) return c.json({ message: 'Incorrect password' }, 401);
        
        const token = await sign({ id: String(user.id) }, c.env.JWT_SECRET);
        const { password: _, ...userData } = user;
        return c.json({ auth: true, token, user: { ...userData, id: String(userData.id) } });
    } catch (e: any) {
        return c.json({ message: e.message }, 500);
    }
});

// --- LISTINGS ---
app.get('/api/listings', async (c) => {
    const sql = neon(c.env.DATABASE_URL);
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const mainCategory = c.req.query('mainCategory');
    const subCategory = c.req.query('subCategory');
    const city = c.req.query('city');
    const search = c.req.query('search');
    const sortBy = c.req.query('sortBy') || 'date-desc';

    let query = `
        SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone", u.profile_image as "sellerImage", u.company_name as "sellerCompanyName", u.is_verified as "isVerified"
        FROM listings l 
        LEFT JOIN users u ON l.user_id = u.id 
        WHERE l.status = 'active'
    `;
    const params: any[] = [];
    if (mainCategory && mainCategory !== 'all') { params.push(mainCategory); query += ` AND l.main_category = $${params.length}`; }
    if (subCategory && subCategory !== 'all') { params.push(subCategory); query += ` AND l.sub_category = $${params.length}`; }
    if (city && city !== 'All Cities') { params.push(city); query += ` AND l.location = $${params.length}`; }
    if (search) { params.push(`%${search.toLowerCase()}%`); query += ` AND (LOWER(l.title) LIKE $${params.length} OR LOWER(l.description) LIKE $${params.length})`; }

    let orderClause = ` ORDER BY u.is_verified DESC`;
    if (sortBy === 'price-asc') orderClause += `, l.price ASC`;
    else if (sortBy === 'price-desc') orderClause += `, l.price DESC`;
    else if (sortBy === 'date-asc') orderClause += `, l.id ASC`; 
    else orderClause += `, l.id DESC`; 

    query += orderClause;
    params.push(limit); query += ` LIMIT $${params.length}`;
    params.push(offset); query += ` OFFSET $${params.length}`;

    const rows = await sql(query, params);
    return c.json(rows.map(r => ({ 
        ...r, 
        id: String(r.id), 
        price: parseFloat(r.price), 
        imageUrls: r.image_url ? r.image_url.split(',') : [], 
        sellerId: String(r.user_id),
        sellerImage: r.sellerImage,
        sellerCompanyName: r.sellerCompanyName,
        isVerified: r.isVerified
    })));
});

app.get('/api/listings/:id', async (c) => {
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    
    const increments = [3, 5, 7, 9];
    const randomIncrement = increments[Math.floor(Math.random() * increments.length)];
    try { 
        await sql`
            UPDATE listings 
            SET views = views + (
                CASE 
                    WHEN u.is_verified = TRUE THEN ${randomIncrement}
                    ELSE 1 
                END
            )
            FROM users u 
            WHERE listings.user_id = u.id AND listings.id = ${parseInt(id)}
        `; 
    } catch (e) {}

    const rows = await sql`
        SELECT l.*, u.name as "sellerName", u.phone as "sellerPhone", u.profile_image as "sellerImage", u.company_name as "sellerCompanyName", u.is_verified as "isVerified"
        FROM listings l 
        LEFT JOIN users u ON l.user_id = u.id 
        WHERE l.id = ${parseInt(id)}
    `;
    if (!rows.length) return c.json({ message: 'Listing not found' }, 404);
    const r = rows[0];
    
    return c.json({ 
        ...r, 
        id: String(r.id), 
        price: parseFloat(r.price), 
        imageUrls: r.image_url ? r.image_url.split(',') : [], 
        sellerId: String(r.user_id),
        sellerImage: r.sellerImage,
        sellerCompanyName: r.sellerCompanyName,
        isVerified: r.isVerified
    });
});

app.get('/api/share/:slug', async (c) => {
    const slug = c.req.param('slug');
    const sql = neon(c.env.DATABASE_URL);
    const rows = await sql`SELECT id FROM listings WHERE share_slug = ${slug}`;
    if (!rows.length) return c.json({ message: 'Not found' }, 404);
    return c.json({ id: String(rows[0].id) });
});

app.post('/api/listings', async (c) => {
    const user = c.get('user');
    const { title, price, unit, location, mainCategory, subCategory, description, imageUrls, contactPhone } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    
    const result = await sql`
        INSERT INTO listings (title, price, unit, location, main_category, sub_category, description, image_url, user_id, contact_phone) 
        VALUES (${title}, ${price}, ${unit}, ${location}, ${mainCategory}, ${subCategory}, ${description}, ${imageUrls.join(',')}, ${parseInt(user.id)}, ${contactPhone || null}) 
        RETURNING id
    `;
    
    const newId = result[0].id;
    const shareSlug = generateShareSlug(title, newId);
    
    const final = await sql`UPDATE listings SET share_slug = ${shareSlug} WHERE id = ${newId} RETURNING *`;
    
    // Post to Telegram (background task)
    const fullListing = { ...final[0], imageUrls, price, unit, title, location, description, contact_phone: contactPhone || user.phone };
    c.executionCtx.waitUntil(postToTelegram(fullListing, c.env));
    
    return c.json({ ...final[0], id: String(final[0].id) });
});

app.put('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const { title, price, unit, location, mainCategory, subCategory, description, imageUrls, status, contactPhone } = await c.req.json();
    const sql = neon(c.env.DATABASE_URL);
    
    const shareSlug = generateShareSlug(title, parseInt(id));

    let result;
    if (user.isAdmin) {
        result = await sql`
            UPDATE listings SET 
                title = ${title}, price = ${price}, unit = ${unit}, location = ${location}, 
                main_category = ${mainCategory}, sub_category = ${subCategory}, 
                description = ${description}, image_url = ${imageUrls.join(',')}, 
                status = ${status || 'active'}, contact_phone = ${contactPhone || null},
                share_slug = ${shareSlug}
            WHERE id = ${parseInt(id)}
            RETURNING *
        `;
    } else {
        result = await sql`
            UPDATE listings SET 
                title = ${title}, price = ${price}, unit = ${unit}, location = ${location}, 
                main_category = ${mainCategory}, sub_category = ${subCategory}, 
                description = ${description}, image_url = ${imageUrls.join(',')}, 
                status = ${status || 'active'}, contact_phone = ${contactPhone || null},
                share_slug = ${shareSlug}
            WHERE id = ${parseInt(id)} AND user_id = ${parseInt(user.id)} 
            RETURNING *
        `;
    }

    if (!result.length) return c.json({ message: 'Not authorized' }, 403);
    return c.json({ ...result[0], id: String(result[0].id) });
});

app.delete('/api/listings/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);

    let result;
    if (user.isAdmin) {
        result = await sql`DELETE FROM listings WHERE id = ${parseInt(id)} RETURNING id`;
    } else {
        result = await sql`DELETE FROM listings WHERE id = ${parseInt(id)} AND user_id = ${parseInt(user.id)} RETURNING id`;
    }

    if (!result.length) return c.json({ message: 'Not authorized' }, 403);
    return c.json({ message: 'Deleted' });
});

// --- SAVED ---
app.get('/api/saved', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    const rows = await sql`SELECT listing_id FROM saved_listings WHERE user_id = ${parseInt(user.id)}`;
    return c.json(rows.map(r => String(r.listing_id)));
});

app.post('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    await sql`INSERT INTO saved_listings (user_id, listing_id) VALUES (${parseInt(user.id)}, ${parseInt(id)}) ON CONFLICT DO NOTHING`;
    return c.json({ message: 'Saved' });
});

app.delete('/api/saved/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    await sql`DELETE FROM saved_listings WHERE user_id = ${parseInt(user.id)} AND listing_id = ${parseInt(id)}`;
    return c.json({ message: 'Unsaved' });
});

// --- PROFILE ---
app.get('/api/users/me', async (c) => c.json(c.get('user')));
app.put('/api/users/me', async (c) => {
    try {
        const user = c.get('user');
        const { name, email, phone, location, profileImage, companyName } = await c.req.json();
        const sql = neon(c.env.DATABASE_URL);
        const userId = parseInt(String(user.id));

        if (name && !validateUsername(name)) {
            return c.json({ message: 'Username can only contain letters, numbers, spaces, and dots (.)' }, 400);
        }

        const cleanEmail = (email && String(email).trim() !== '') ? String(email).trim().toLowerCase() : null;
        if (cleanEmail) {
            const emailExisting = await sql`SELECT id FROM users WHERE email IS NOT NULL AND LOWER(email) = ${cleanEmail} AND id != ${userId}`;
            if (emailExisting.length) return c.json({ message: 'Email already in use by another account' }, 409);
        }

        const normPhone = normalizePhoneForStorage(phone);
        if (normPhone) {
            const variants = getLoginVariants(phone);
            const phoneExisting = await sql`SELECT id FROM users WHERE (phone = ANY(${variants}) OR phone = ${normPhone}) AND id != ${userId}`;
            if (phoneExisting.length) return c.json({ message: 'Phone number already in use by another account' }, 409);
        }

        await sql`
            UPDATE users SET 
                name = ${name}, 
                email = ${cleanEmail}, 
                phone = ${normPhone || user.phone}, 
                location = ${location}, 
                profile_image = ${profileImage}, 
                company_name = ${companyName} 
            WHERE id = ${userId}
        `;
        
        return c.json({ message: 'Updated' });
    } catch (e: any) {
        return c.json({ message: e.message || 'Update failed' }, 500);
    }
});

// --- UPLOAD ---
app.post('/api/upload', async (c) => {
    try {
        const formData = await c.req.formData();
        const rawFiles = formData.getAll('photos');
        if (!rawFiles || rawFiles.length === 0) return c.json({ message: 'No files' }, 400);
        const urls: string[] = [];
        const userId = c.get('user')?.id || 'anonymous';
        const publicUrl = c.env.R2_PUBLIC_URL.endsWith('/') 
            ? c.env.R2_PUBLIC_URL.slice(0, -1) 
            : c.env.R2_PUBLIC_URL;

        for (const item of (rawFiles as any[])) {
            if (typeof item === 'string') continue;
            
            const fileName = String(item.name || 'image');
            const fileType = String(item.type || 'image/jpeg');
            
            const key = `${userId}-${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            await c.env.R2_BUCKET.put(key, item, { httpMetadata: { contentType: fileType } });
            urls.push(`${publicUrl}/${key}`);
        }
        return c.json({ urls });
    } catch (e: any) { return c.json({ message: e.message }, 500); }
});

// --- CHAT ---
app.post('/api/conversations', async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const { listingId } = body;
        
        if (!listingId) return c.json({ message: 'Listing ID is required' }, 400);

        const sql = neon(c.env.DATABASE_URL);
        const lId = parseInt(String(listingId));
        if (isNaN(lId)) return c.json({ message: 'Invalid Listing ID' }, 400);

        const listing = await sql`SELECT user_id FROM listings WHERE id = ${lId}`;
        if (!listing.length) return c.json({ message: 'Listing not found' }, 404);
        
        const sellerId = listing[0].user_id;
        const buyerId = parseInt(String(user.id));

        if (buyerId === sellerId) return c.json({ message: 'You cannot start a chat with yourself' }, 400);

        const existing = await sql`
            SELECT id FROM conversations 
            WHERE listing_id = ${lId} 
            AND buyer_id = ${buyerId} 
            AND seller_id = ${sellerId}
        `;
        
        if (existing.length) return c.json({ id: String(existing[0].id) });

        const res = await sql`
            INSERT INTO conversations (listing_id, buyer_id, seller_id) 
            VALUES (${lId}, ${buyerId}, ${sellerId}) 
            RETURNING id
        `;
        
        return c.json({ id: String(res[0].id) });
    } catch (e: any) {
        console.error("Conversation creation error:", e.message);
        return c.json({ message: e.message || 'Failed to create conversation' }, 500);
    }
});

app.get('/api/conversations', async (c) => {
    const user = c.get('user');
    const sql = neon(c.env.DATABASE_URL);
    const rows = await sql`
        SELECT c.id as conversation_id, c.listing_id, l.title as listing_title, l.image_url,
               CASE WHEN c.buyer_id = ${parseInt(user.id)} THEN c.seller_id ELSE c.buyer_id END as other_user_id,
               CASE WHEN c.buyer_id = ${parseInt(user.id)} THEN u_seller.name ELSE u_buyer.name END as other_user_name,
               CASE WHEN c.buyer_id = ${parseInt(user.id)} THEN u_seller.profile_image ELSE u_buyer.profile_image END as other_user_image,
               m.content as last_message, m.created_at as last_message_date,
               (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = ${parseInt(user.id)} AND is_read = false) as unread_count
        FROM conversations c
        JOIN listings l ON c.listing_id = l.id
        LEFT JOIN users u_buyer ON c.buyer_id = u_buyer.id
        LEFT JOIN users u_seller ON c.seller_id = u_seller.id
        LEFT JOIN messages m ON c.id = m.conversation_id AND m.id = (SELECT MAX(id) FROM messages WHERE conversation_id = c.id)
        WHERE c.buyer_id = ${parseInt(user.id)} OR c.seller_id = ${parseInt(user.id)}
        ORDER BY COALESCE(m.created_at, TO_TIMESTAMP(0)) DESC, c.id DESC
    `;
    return c.json(rows.map(r => ({ 
        conversationId: String(r.conversation_id), 
        listingId: String(r.listing_id), 
        listingTitle: r.listing_title, 
        listingImage: r.image_url ? r.image_url.split(',')[0] : '', 
        otherUserId: String(r.other_user_id), 
        otherUserName: r.other_user_name, 
        otherUserImage: r.other_user_image,
        lastMessage: r.last_message || '', 
        lastMessageDate: r.last_message_date || new Date(), 
        unreadCount: parseInt(r.unread_count) 
    })));
});

app.post('/api/conversations/:id/read', async (c, next) => {
    const user = c.get('user');
    const cid = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    await sql`UPDATE messages SET is_read = true WHERE conversation_id = ${parseInt(cid)} AND receiver_id = ${parseInt(user.id)}`;
    return c.json({ message: 'Marked as read' });
});

app.get('/api/conversations/:id/messages', async (c) => {
    const user = c.get('user');
    const cid = c.req.param('id');
    const sql = neon(c.env.DATABASE_URL);
    const conv = await sql`SELECT id FROM conversations WHERE id = ${parseInt(cid)} AND (buyer_id = ${parseInt(user.id)} OR seller_id = ${parseInt(user.id)})`;
    if (!conv.length) return c.json({ message: 'Not found' }, 404);
    
    await sql`UPDATE messages SET is_read = true WHERE conversation_id = ${parseInt(cid)} AND receiver_id = ${parseInt(user.id)}`;
    
    const rows = await sql`SELECT id, conversation_id, sender_id, receiver_id, content, created_at FROM messages WHERE conversation_id = ${parseInt(cid)} ORDER BY created_at ASC`;
    return c.json(rows.map(r => ({ ...r, id: String(r.id), conversation_id: String(r.conversation_id), sender_id: String(r.sender_id), receiver_id: String(r.receiver_id), timestamp: r.created_at })));
});

app.post('/api/messages', async (c) => {
    try {
        const user = c.get('user');
        const body = await c.req.json();
        const { conversationId, receiverId, content } = body;
        
        if (!conversationId || !receiverId || !content) {
            return c.json({ message: 'Missing required fields' }, 400);
        }

        const sql = neon(c.env.DATABASE_URL);
        const convId = parseInt(String(conversationId));
        const senderId = parseInt(String(user.id));
        const recvId = parseInt(String(receiverId));

        if (isNaN(convId) || isNaN(senderId) || isNaN(recvId)) {
            return c.json({ message: 'Invalid ID format' }, 400);
        }

        const result = await sql`
            INSERT INTO messages (conversation_id, sender_id, receiver_id, content) 
            VALUES (${convId}, ${senderId}, ${recvId}, ${content}) 
            RETURNING id, created_at
        `;
        
        if (result.length === 0) throw new Error('Insert failed');

        return c.json({ 
            ...result[0], 
            id: String(result[0].id), 
            conversation_id: String(convId), 
            sender_id: String(senderId), 
            receiver_id: String(recvId), 
            content, 
            timestamp: result[0].created_at 
        });
    } catch (e: any) {
        console.error("Message send error:", e.message);
        return c.json({ message: e.message || 'Failed to send message' }, 500);
    }
});

export default app;
