// Standalone seeding script for MongoDB Atlas
// Run this script with: node seed-standalone.js

// First, check if required modules are installed
try {
  require('mongoose');
  require('bcryptjs');
} catch (err) {
  console.log('Installing required dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install mongoose bcryptjs', { stdio: 'inherit' });
    console.log('Dependencies installed successfully.');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Now proceed with the seeding
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Database connection
const connectionString = 'mongodb+srv://AbdelkhalekMo:Abdelkhalek%40123@cluster0.fquxhea.mongodb.net/Ecommerce';

console.log('Starting direct database seeding...');
console.log(`Connecting to MongoDB Atlas...`);

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB Atlas');
  
  // Define schemas
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    cartItems: Array,
    createdAt: Date,
    updatedAt: Date
  });
  
  const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String,
    category: String,
    isFeatured: Boolean,
    stock: Number,
    ratings: Array,
    averageRating: Number,
    createdAt: Date,
    updatedAt: Date
  });
  
  const orderSchema = new mongoose.Schema({
    user: mongoose.Schema.Types.ObjectId,
    products: Array,
    totalAmount: Number,
    status: String,
    paymentStatus: String,
    shippingAddress: Object,
    shippingMethod: String,
    discountAmount: Number,
    createdAt: Date,
    updatedAt: Date
  });
  
  const couponSchema = new mongoose.Schema({
    code: String,
    discountPercentage: Number,
    expirationDate: Date,
    isActive: Boolean,
    userId: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date
  });
  
  // Create models
  const User = mongoose.model('User', userSchema);
  const Product = mongoose.model('Product', productSchema);
  const Order = mongoose.model('Order', orderSchema);
  const Coupon = mongoose.model('Coupon', couponSchema);
  
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Coupon.deleteMany({});
    
    // Seed users
    console.log('Seeding users...');
    const users = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: await bcrypt.hash("Admin123!", 10),
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "John Doe",
        email: "john@example.com",
        password: await bcrypt.hash("John123!", 10),
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: await bcrypt.hash("Jane123!", 10),
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Mike Johnson",
        email: "mike@example.com",
        password: await bcrypt.hash("Mike123!", 10),
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Sarah Williams",
        email: "sarah@example.com",
        password: await bcrypt.hash("Sarah123!", 10),
        role: "customer",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users seeded successfully!`);
    
    // Get user IDs for reference
    const adminUser = createdUsers.find(user => user.email === "admin@example.com");
    const johnUser = createdUsers.find(user => user.email === "john@example.com");
    
    // Seed products
    console.log('Seeding products...');
    const products = [
      {
        name: "iPhone 14 Pro",
        description: "Apple's latest flagship smartphone with A16 Bionic chip, 48MP camera, and Dynamic Island display feature. Comes with iOS 16 and all-day battery life.",
        price: 999.99,
        image: "https://images.unsplash.com/photo-1663499482523-1c0c1bae4ce1",
        category: "electronics",
        isFeatured: true,
        stock: 50,
        averageRating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Samsung Galaxy S23 Ultra",
        description: "Samsung's premium smartphone with Snapdragon 8 Gen 2 processor, 200MP camera, and S Pen functionality. Features a stunning 6.8-inch Dynamic AMOLED display.",
        price: 1199.99,
        image: "https://images.unsplash.com/photo-1676315527610-8f5b96bee207",
        category: "electronics",
        isFeatured: true,
        stock: 35,
        averageRating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Men's Classic Fit Dress Shirt",
        description: "Premium cotton dress shirt with wrinkle-resistant fabric. Perfect for formal occasions or office wear. Available in various sizes.",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
        category: "clothing",
        isFeatured: false,
        stock: 100,
        averageRating: 4.3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Women's Casual Summer Dress",
        description: "Lightweight, breathable summer dress made from 100% cotton. Features a flattering A-line cut and comes in various patterns and colors.",
        price: 59.99,
        image: "https://images.unsplash.com/photo-1623609163841-5e69d8c62cc7",
        category: "clothing",
        isFeatured: true,
        stock: 75,
        averageRating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "The Psychology of Money",
        description: "Timeless lessons on wealth, greed, and happiness. Morgan Housel's book explores the strange ways people think about money and teaches you how to make better sense of it.",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
        category: "books",
        isFeatured: false,
        stock: 120,
        averageRating: 4.9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Atomic Habits",
        description: "James Clear's guide to building good habits and breaking bad ones. Learn how tiny changes can yield remarkable results over time.",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1598618443855-232ee0f819f6",
        category: "books",
        isFeatured: true,
        stock: 85,
        averageRating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Modern Coffee Table",
        description: "Sleek, mid-century modern coffee table with solid wood legs and tempered glass top. Perfect centerpiece for any living room.",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1532372576444-dda954194ad0",
        category: "home",
        isFeatured: false,
        stock: 20,
        averageRating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Smart LED Floor Lamp",
        description: "WiFi-enabled floor lamp with adjustable brightness and color temperature. Compatible with Alexa and Google Home for voice control.",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
        category: "home",
        isFeatured: true,
        stock: 40,
        averageRating: 4.4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Yoga Mat Premium",
        description: "Extra thick 6mm eco-friendly yoga mat with excellent grip and cushioning. Includes carrying strap and comes in multiple colors.",
        price: 39.99,
        image: "https://images.unsplash.com/photo-1592432678016-e910b452f9a2",
        category: "sports",
        isFeatured: false,
        stock: 60,
        averageRating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Wireless Bluetooth Earbuds",
        description: "True wireless earbuds with active noise cancellation, 24-hour battery life, and water resistance. Perfect for workouts and daily use.",
        price: 129.99,
        image: "https://images.unsplash.com/photo-1606741965509-717b9bfcfb43",
        category: "electronics",
        isFeatured: true,
        stock: 45,
        averageRating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products seeded successfully!`);
    
    // Get product IDs for reference
    const iPhone = createdProducts.find(product => product.name === "iPhone 14 Pro");
    const yogaMat = createdProducts.find(product => product.name === "Yoga Mat Premium");
    const coffeeTable = createdProducts.find(product => product.name === "Modern Coffee Table");
    const atomicHabits = createdProducts.find(product => product.name === "Atomic Habits");
    const psychologyOfMoney = createdProducts.find(product => product.name === "The Psychology of Money");
    
    // Seed orders
    console.log('Seeding orders...');
    const orders = [
      {
        user: johnUser._id,
        products: [
          {
            product: iPhone._id,
            quantity: 1,
            price: iPhone.price
          },
          {
            product: yogaMat._id,
            quantity: 2,
            price: yogaMat.price
          }
        ],
        totalAmount: iPhone.price + (yogaMat.price * 2),
        status: "completed",
        paymentStatus: "paid",
        shippingAddress: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001"
        },
        shippingMethod: "standard",
        discountAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user: johnUser._id,
        products: [
          {
            product: coffeeTable._id,
            quantity: 1,
            price: coffeeTable.price
          }
        ],
        totalAmount: coffeeTable.price,
        status: "processing",
        paymentStatus: "paid",
        shippingAddress: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          zipCode: "90001"
        },
        shippingMethod: "express",
        discountAmount: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        user: johnUser._id,
        products: [
          {
            product: atomicHabits._id,
            quantity: 1,
            price: atomicHabits.price
          },
          {
            product: psychologyOfMoney._id,
            quantity: 1,
            price: psychologyOfMoney.price
          }
        ],
        totalAmount: atomicHabits.price + psychologyOfMoney.price,
        status: "pending",
        paymentStatus: "pending",
        shippingAddress: {
          street: "789 Pine Blvd",
          city: "Chicago",
          state: "IL",
          country: "USA",
          zipCode: "60007"
        },
        shippingMethod: "standard",
        discountAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const createdOrders = await Order.insertMany(orders);
    console.log(`${createdOrders.length} orders seeded successfully!`);
    
    // Seed coupons
    console.log('Seeding coupons...');
    const coupons = [
      {
        code: "WELCOME10",
        discountPercentage: 10,
        expirationDate: new Date("2023-12-31T23:59:59.999Z"),
        isActive: true,
        userId: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: "SUMMER20",
        discountPercentage: 20,
        expirationDate: new Date("2023-09-30T23:59:59.999Z"),
        isActive: true,
        userId: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: "FLASH30",
        discountPercentage: 30,
        expirationDate: new Date("2023-08-15T23:59:59.999Z"),
        isActive: false,
        userId: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`${createdCoupons.length} coupons seeded successfully!`);
    
    console.log('All data seeded successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
    // Exit the process after a short delay to ensure all logs are printed
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 