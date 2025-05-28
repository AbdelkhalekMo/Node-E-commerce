import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

// Cache configuration
const CACHE_TTL = 5 * 60; // 5 minutes in seconds
const cache = new Map();

// Validation helpers
const validateProduct = (data) => {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (!data.price || isNaN(data.price) || data.price <= 0) {
    errors.push('Price must be a positive number');
  }
  if (!data.category) {
    errors.push('Category is required');
  }
  return errors;
};

// Cache helper
const getCacheKey = (key, params = {}) => {
  return `${key}:${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    expiry: Date.now() + (CACHE_TTL * 1000)
  });
};

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, category } = req.query;
    const cacheKey = getCacheKey('products', { page, limit, sort, category });
    
    // Check cache first
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Build query
    const query = category ? { category } : {};
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort ? { [sort]: 1 } : { createdAt: -1 },
      lean: true
    };

    const products = await Product.paginate(query, options);
    
    // Cache results
    setCache(cacheKey, products);
    
    res.json(products);
  } catch (error) {
    console.error("Error in getAllProducts controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const cacheKey = 'featured-products';
    const cached = getFromCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const featuredProducts = await Product.find({ isFeatured: true })
      .select('-__v')
      .lean()
      .limit(8);

    if (!featuredProducts?.length) {
      return res.status(404).json({ message: "No featured products found" });
    }

    setCache(cacheKey, featuredProducts);
    res.json(featuredProducts);
  } catch (error) {
    console.error("Error in getFeaturedProducts controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch featured products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate product data
    const validationErrors = validateProduct(productData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Use the provided imageUrl directly if Cloudinary credentials are not available
    let imageUrl = productData.imageUrl || '';
    
    // Only attempt to upload to Cloudinary if credentials are available
    if (productData.image && 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      try {
        const cloudinaryResponse = await cloudinary.uploader.upload(productData.image, {
          folder: "products",
          quality: "auto:good",
          fetch_format: "auto"
        });
        imageUrl = cloudinaryResponse.secure_url;
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        // If Cloudinary upload fails, fall back to the provided imageUrl
        console.log("Falling back to provided imageUrl:", imageUrl);
      }
    } else {
      console.log("Cloudinary credentials not available, using provided imageUrl:", imageUrl);
    }

    const product = await Product.create({
      ...productData,
      image: imageUrl
    });

    // Clear relevant caches
    cache.delete('products');
    if (product.isFeatured) {
      cache.delete('featured-products');
    }

    res.status(201).json(product);
  } catch (error) {
    console.error("Error in createProduct controller:", error);
    res.status(500).json({ 
      message: "Failed to create product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id).session(session);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete image from cloudinary if exists and credentials are available
    if (product.image && 
        product.image.includes('cloudinary') &&
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from cloudinary:", cloudinaryError);
        // Continue with product deletion even if image deletion fails
      }
    }

    await Product.findByIdAndDelete(id).session(session);
    await session.commitTransaction();

    // Clear relevant caches
    cache.clear(); // Clear all cache since product listings will change

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in deleteProduct controller:", error);
    res.status(500).json({ 
      message: "Failed to delete product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  } finally {
    session.endSession();
  }
};

export const getRecommendedProducts = async (req, res) => {
  try {
    const { category, excludeId } = req.query;
    const cacheKey = getCacheKey('recommended', { category, excludeId });
    
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const query = category ? { category } : {};
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const products = await Product.aggregate([
      { $match: query },
      { $sample: { size: 4 } },
      { 
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
          category: 1
        }
      }
    ]);

    setCache(cacheKey, products);
    res.json(products);
  } catch (error) {
    console.error("Error in getRecommendedProducts controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch recommended products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10, sort } = req.query;
    
    const cacheKey = getCacheKey(`category-${category}`, { page, limit, sort });
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sort ? { [sort]: 1 } : { createdAt: -1 },
      lean: true
    };

    const products = await Product.paginate({ category }, options);
    
    if (!products.docs.length) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    setCache(cacheKey, products);
    res.json(products);
  } catch (error) {
    console.error("Error in getProductsByCategory controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch products by category",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    // Clear featured products cache
    cache.delete('featured-products');

    res.json(product);
  } catch (error) {
    console.error("Error in toggleFeaturedProduct controller:", error);
    res.status(500).json({ 
      message: "Failed to toggle featured status",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const cacheKey = `product-${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    setCache(cacheKey, product);
    res.json(product);
  } catch (error) {
    console.error("Error in getProductById controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    // Validate product data
    const validationErrors = validateProduct(productData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Handle image upload if a new image is provided
    let imageUrl = product.image;
    
    // Check if a new imageUrl is provided
    if (productData.imageUrl && productData.imageUrl !== product.image) {
      imageUrl = productData.imageUrl;
    }
    
    // Only attempt to upload to Cloudinary if credentials are available
    if (productData.image && 
        productData.image !== product.image && 
        process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      try {
        // Delete old image if exists
        if (product.image && product.image.includes('cloudinary')) {
          const publicId = product.image.split("/").pop().split(".")[0];
          try {
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Error deleting old image from cloudinary:", cloudinaryError);
          }
        }
        
        // Upload new image
        const cloudinaryResponse = await cloudinary.uploader.upload(productData.image, {
          folder: "products",
          quality: "auto:good",
          fetch_format: "auto"
        });
        imageUrl = cloudinaryResponse.secure_url;
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        console.log("Falling back to provided imageUrl or existing image");
        // If Cloudinary upload fails, we'll use the imageUrl or keep the existing image
      }
    } else if (productData.image && productData.image !== product.image) {
      console.log("Cloudinary credentials not available, using provided imageUrl or existing image");
    }
    
    // Update product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        ...productData,
        image: imageUrl,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    // Clear relevant caches
    cache.clear(); // Clear all cache since product listings will change
    
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error in updateProduct controller:", error);
    res.status(500).json({ 
      message: "Failed to update product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
  }
};

