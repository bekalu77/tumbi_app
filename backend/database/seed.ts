
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'local.db');
const db = new Database(dbPath);

const CATEGORIES = [
  { id: '1', name: 'All', slug: 'all', icon: 'HomeIcon' },
  { id: '2', name: 'Materials', slug: 'materials', icon: 'HammerIcon' },
  { id: '3', name: 'Services', slug: 'services', icon: 'WrenchIcon' },
  { id: '4', name: 'Equipment', slug: 'equipment', icon: 'TruckIcon' },
];

const MOCK_USERS = [
    {
        name: 'Dangote Distributors',
        email: 'dangote@distro.com',
        phone: '+2348000000001',
        password: 'password123',
        location: 'Lagos, Ikeja'
    },
    {
        name: 'QuickFix Plumbing',
        email: 'plumber@quick.com',
        phone: '+2348000000002',
        password: 'password123',
        location: 'Abuja, Central'
    },
     {
        name: 'BuildRight Supplies',
        email: 'build@right.com',
        phone: '+2348000000003',
        password: 'password123',
        location: 'Kano, Market'
    },
     {
        name: 'Heavy Machinery Co',
        email: 'heavy@machinery.com',
        phone: '+2348000000004',
        password: 'password123',
        location: 'Port Harcourt'
    },
     {
        name: 'RoofMasters',
        email: 'roof@masters.com',
        phone: '+2348000000005',
        password: 'password123',
        location: 'Lagos, Lekki'
    },
    {
        name: 'Modern Designs Arch',
        email: 'design@modern.com',
        phone: '+2348000000006',
        password: 'password123',
        location: 'Remote / National'
    }
];

const INITIAL_LISTINGS = [
  {
    id: '1',
    title: 'High Quality Red Bricks (5000 pcs)',
    price: 450,
    unit: 'trip',
    location: 'Lagos, Ikeja',
    category: 'materials',
    type: 'product',
    description: 'Premium burnt clay bricks suitable for structural walls. Delivery available within Lagos.',
    imageUrls: ['/uploads/brick1.jpg', '/uploads/brick2.jpg'],
    sellerName: 'Dangote Distributors',
    isVerified: true,
  },
  {
    id: '2',
    title: 'Professional Plumbing Service',
    price: 50,
    unit: 'hr',
    location: 'Abuja, Central',
    category: 'services',
    type: 'service',
    description: 'Experienced plumber available for repairs, installations, and maintenance. 24/7 emergency service.',
    imageUrls: ['/uploads/plumber1.jpg'],
    sellerName: 'QuickFix Plumbing',
    isVerified: true,
  },
  {
    id: '3',
    title: 'Portland Cement - 50kg Bag',
    price: 12,
    unit: 'bag',
    location: 'Kano, Market',
    category: 'materials',
    type: 'product',
    description: 'Grade 42.5N Cement. Perfect for concrete, plastering and screeding.',
    imageUrls: ['/uploads/cement1.jpg'],
    sellerName: 'BuildRight Supplies',
    isVerified: false,
  },
];

function seedDatabase() {
  console.log('Seeding database...');

  // Seed Categories
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, slug, icon) VALUES (?, ?, ?)');
  CATEGORIES.forEach(category => {
    insertCategory.run(category.name, category.slug, category.icon);
  });
  console.log('Categories seeded.');

  // Seed Users
  const userMap = new Map<string, number>();
  const insertUser = db.prepare('INSERT INTO users (name, email, phone, password, location) VALUES (?, ?, ?, ?, ?)');
  MOCK_USERS.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, 8);
      const result = insertUser.run(user.name, user.email, user.phone, hashedPassword, user.location);
      userMap.set(user.name, result.lastInsertRowid as number);
  });
  console.log('Users seeded.');

  // Seed Listings
  const insertListing = db.prepare(`
    INSERT INTO listings (title, price, unit, location, category_slug, listing_type, description, image_url, user_id, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  INITIAL_LISTINGS.forEach(listing => {
    const userId = userMap.get(listing.sellerName);
    if (userId) {
        const imageUrlsString = listing.imageUrls.join(',');
        insertListing.run(
            listing.title,
            listing.price,
            listing.unit,
            listing.location,
            listing.category,
            listing.type, 
            listing.description,
            imageUrlsString,
            userId,
            listing.isVerified ? 1 : 0
        );
    } else {
        console.warn(`Could not find user for seller: ${listing.sellerName}`);
    }
  });
  console.log('Listings seeded.');
}

seedDatabase();
