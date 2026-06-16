const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  // WATCHES
  { name: 'Watch 1', description: 'Elegant analog watch', price: 50, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch1.jpg', isMain: true }] },
  { name: 'Watch 2', description: 'Modern sporty watch', price: 70, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch2.webp', isMain: true }] },
  { name: 'Watch 3', description: 'Classic leather strap watch', price: 30, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch3.webp', isMain: true }] },
  { name: 'Watch 4', description: 'Minimalist steel watch', price: 80, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch4.webp', isMain: true }] },
  { name: 'Watch 5', description: 'Luxury gold-tone watch', price: 80, category: 'watches', brand: 'Glamora', stock: 20, images: [{ url: '/img/watch5.png', isMain: true }] },

  // RINGS
  { name: 'Ring 1', description: 'Sparkling statement ring', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring4.avif', isMain: true }] },
  { name: 'Ring 2', description: 'Delicate gold band ring', price: 70, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring1.jpg', isMain: true }] },
  { name: 'Ring 3', description: 'Vintage inspired ring', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring3.webp', isMain: true }] },
  { name: 'Ring 4', description: 'Simple silver band ring', price: 30, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring5.jpg', isMain: true }] },
  { name: 'Ring 5', description: 'Crystal stone ring', price: 50, category: 'rings', brand: 'Glamora', stock: 25, images: [{ url: '/img/ring2.webp', isMain: true }] },

  // GLASSES
  { name: 'Glasses 1', description: 'Trendy round sunglasses', price: 20, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass1.webp', isMain: true }] },
  { name: 'Glasses 2', description: 'Classic cat-eye sunglasses', price: 30, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass2.jpg', isMain: true }] },
  { name: 'Glasses 3', description: 'Oversized fashion sunglasses', price: 40, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass3.jpg', isMain: true }] },
  { name: 'Glasses 4', description: 'Retro square sunglasses', price: 40, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass5.png', isMain: true }] },
  { name: 'Glasses 5', description: 'Premium designer sunglasses', price: 50, category: 'glasses', brand: 'Glamora', stock: 30, images: [{ url: '/img/glass6.png', isMain: true }] },

  // BRACELETS
  { name: 'Bracelet 1', description: 'Beaded charm bracelet', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace1.jpg', isMain: true }] },
  { name: 'Bracelet 2', description: 'Chain link bracelet', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace2.jpg', isMain: true }] },
  { name: 'Bracelet 3', description: 'Pearl accent bracelet', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace5.jpg', isMain: true }] },
  { name: 'Bracelet 4', description: 'Simple bangle bracelet', price: 10, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace6.jpg', isMain: true }] },
  { name: 'Bracelet 5', description: 'Layered chain bracelet', price: 20, category: 'bracelets', brand: 'Glamora', stock: 35, images: [{ url: '/img/brace4.jpg', isMain: true }] },

  // EARRINGS
  { name: 'Earring 1', description: 'Dangle drop earrings', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear1.jpg', isMain: true }] },
  { name: 'Earring 2', description: 'Classic stud earrings', price: 10, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear2.jpg', isMain: true }] },
  { name: 'Earring 3', description: 'Hoop earrings', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear3.jpg', isMain: true }] },
  { name: 'Earring 4', description: 'Crystal stud earrings', price: 10, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear6.jpg', isMain: true }] },
  { name: 'Earring 5', description: 'Luxury pearl earrings', price: 20, category: 'earrings', brand: 'Glamora', stock: 30, images: [{ url: '/img/ear5.png', isMain: true }] },

  // NECKLACES
  { name: 'Necklace 1', description: 'Delicate pendant necklace', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck1.jpg', isMain: true }] },
  { name: 'Necklace 2', description: 'Layered chain necklace', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck2.jpg', isMain: true }] },
  { name: 'Necklace 3', description: 'Statement choker necklace', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck3.jpg', isMain: true }] },
  { name: 'Necklace 4', description: 'Crystal Necklace', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck6.jpg', isMain: true }] },
  { name: 'Necklace 5', description: 'Elegant pearl necklace', price: 50, category: 'necklaces', brand: 'Glamora', stock: 20, images: [{ url: '/img/neck7.webp', isMain: true }] },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    await Product.deleteMany({}); // Clear existing products first
    console.log('Old products removed.');

    await Product.insertMany(products);
    console.log(`${products.length} products added successfully!`);

    process.exit();
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();