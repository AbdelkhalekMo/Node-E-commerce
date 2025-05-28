import mongoose from 'mongoose';
import Product from './models/product.model.js';
import { config } from './lib/config.js';

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// One simple beauty product
const beautyProduct = {
  name: 'Luxury Face Cream',
  description: 'Premium face cream with hyaluronic acid for deep hydration and anti-aging benefits.',
  price: 49.99,
  image: 'https://images.unsplash.com/photo-1570194065650-d99fb4d8a325?w=600&auto=format',
  category: 'beauty',
  stock: 100,
  isFeatured: true
};

// Seed function
const seedBeautyProduct = async () => {
  try {
    // Check if beauty products already exist
    const existingProducts = await Product.countDocuments({ category: 'beauty' });
    
    if (existingProducts > 0) {
      console.log(`${existingProducts} beauty products already exist in the database.`);
      console.log('Skipping seeding to avoid duplicates.');
    } else {
      // Insert the beauty product
      const product = new Product(beautyProduct);
      await product.save();
      console.log('Successfully added beauty product to the database!');
    }
    
    mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding beauty product:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedBeautyProduct(); 