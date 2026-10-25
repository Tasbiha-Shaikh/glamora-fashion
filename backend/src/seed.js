const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const User = require('./models/User');

dotenv.config();

const products = [
  // WATCHES
  { name: 'Watch 1', description: 'Elegant analog watch with refined gold-tone detailing.', price: 50, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch1.jpg', isMain: true }] },
  { name: 'Watch 2', description: 'Modern sporty watch with silicone strap and luminous hands.', price: 70, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch2.webp', isMain: true }] },
  { name: 'Watch 3', description: 'Classic leather strap watch with minimalist dial.', price: 30, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch3.webp', isMain: true }] },
  { name: 'Watch 4', description: 'Minimalist steel watch with brushed silver bezel.', price: 80, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch4.webp', isMain: true }] },
  { name: 'Watch 5', description: 'Luxury gold-tone watch with Roman numerals.', price: 80, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch5.png', isMain: true }] },

  // RINGS
  { name: 'Ring 1', description: 'Sparkling statement ring with pavé cubic zirconia.', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring4.avif', isMain: true }] },
  { name: 'Ring 2', description: 'Delicate gold band ring suitable for stacking.', price: 70, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring1.jpg', isMain: true }] },
  { name: 'Ring 3', description: 'Vintage inspired ring with intricate filigree.', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring3.webp', isMain: true }] },
  { name: 'Ring 4', description: 'Simple silver band ring with polished rhodium finish.', price: 30, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring5.jpg', isMain: true }] },
  { name: 'Ring 5', description: 'Crystal stone ring with vibrant solitaire centerpiece.', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring2.webp', isMain: true }] },

  // GLASSES
  { name: 'Glasses 1', description: 'Trendy round sunglasses with UV400 polarized lenses.', price: 20, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass1.webp', isMain: true }] },
  { name: 'Glasses 2', description: 'Classic cat-eye sunglasses with tortoiseshell frame.', price: 30, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass2.jpg', isMain: true }] },
  { name: 'Glasses 3', description: 'Oversized fashion sunglasses with gradient smoke tint.', price: 40, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass3.jpg', isMain: true }] },
  { name: 'Glasses 4', description: 'Retro square sunglasses with reinforced acetate frame.', price: 40, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass5.png', isMain: true }] },
  { name: 'Glasses 5', description: 'Premium designer sunglasses with gold brow bridge.', price: 50, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass6.png', isMain: true }] },

  // BRACELETS
  { name: 'Bracelet 1', description: 'Beaded charm bracelet with authentic semi-precious beads.', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace1.jpg', isMain: true }] },
  { name: 'Bracelet 2', description: 'Chain link bracelet crafted from 18k gold-plated brass.', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace2.jpg', isMain: true }] },
  { name: 'Bracelet 3', description: 'Pearl accent bracelet with genuine freshwater pearl.', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace5.jpg', isMain: true }] },
  { name: 'Bracelet 4', description: 'Simple bangle bracelet with comfortable curved fit.', price: 10, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace6.jpg', isMain: true }] },
  { name: 'Bracelet 5', description: 'Layered chain bracelet with double delicate strands.', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace4.jpg', isMain: true }] },

  // EARRINGS
  { name: 'Earring 1', description: 'Dangle drop earrings that catch the light elegantly.', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear1.jpg', isMain: true }] },
  { name: 'Earring 2', description: 'Classic stud earrings with hypoallergenic surgical steel posts.', price: 10, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear2.jpg', isMain: true }] },
  { name: 'Earring 3', description: 'Hoop earrings with high-polish gloss and secure clasp.', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear3.jpg', isMain: true }] },
  { name: 'Earring 4', description: 'Crystal stud earrings featuring radiant multifaceted cuts.', price: 10, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear6.jpg', isMain: true }] },
  { name: 'Earring 5', description: 'Luxury pearl earrings combining cultured pearls and crystals.', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear5.png', isMain: true }] },

  // NECKLACES
  { name: 'Necklace 1', description: 'Delicate pendant necklace with adjustable 16-18 inch chain.', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck1.jpg', isMain: true }] },
  { name: 'Necklace 2', description: 'Layered chain necklace with dual textured chains.', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck2.jpg', isMain: true }] },
  { name: 'Necklace 3', description: 'Statement choker necklace with modern architectural links.', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck3.jpg', isMain: true }] },
  { name: 'Necklace 4', description: 'Crystal Necklace with shimmering teardrop focal stone.', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck6.jpg', isMain: true }] },
  { name: 'Necklace 5', description: 'Elegant pearl necklace featuring hand-knotted pearls.', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck7.webp', isMain: true }] },
];

const seedDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is missing from environment. Set it in .env or pass it in command line.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected successfully.');

    // 1. Seed Products
    await Product.deleteMany({});
    console.log('Old products cleared.');

    await Product.insertMany(products);
    console.log(`✓ ${products.length} products inserted successfully!`);

    // 2. Seed Admin User
    const adminEmail = 'Tasbiha@gmail.com'.toLowerCase();
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Tasbiha',
        email: adminEmail,
        password: 'Tasbi@13017',
        role: 'admin',
      });
      console.log(`✓ Admin user created: ${adminEmail}`);
    } else {
      admin.name = 'Tasbiha';
      admin.password = 'Tasbi@13017';
      admin.role = 'admin';
      await admin.save();
      console.log(`✓ Admin user updated: ${adminEmail}`);
    }

    // 3. Seed Demo Customer User if not exists
    const customerEmail = 'customer@glamora.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: customerEmail,
        password: 'customerpassword123',
        role: 'user',
      });
      console.log(`✓ Demo customer created: ${customerEmail} (password: customerpassword123)`);
    } else {
      console.log(`ℹ Demo customer already exists: ${customerEmail}`);
    }

    console.log('\n===============================================');
    console.log('🎉 Database seeding complete!');
    console.log('===============================================');
    console.log('Admin Portal:  /admin');
    console.log('Admin Login:   Tasbiha@gmail.com / Tasbi@13017');
    console.log('Customer Login: customer@glamora.com / customerpassword123');
    console.log('===============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('✕ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();
