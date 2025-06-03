import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import { logActivity } from "./activity.controller.js";

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
    
    // If limit is 0, return all products without pagination
    if (parseInt(limit) === 0) {
      console.log('Fetching all products without pagination');
      const sortOption = sort ? { [sort]: 1 } : { createdAt: -1 };
      
      const products = await Product.find(query)
        .sort(sortOption)
        .lean();
      
      // Cache results
      setCache(cacheKey, products);
      
      return res.json(products);
    }
    
    // Otherwise use pagination
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
    
    // Remove _id field if it exists to let MongoDB generate it
    if (productData._id === "" || productData._id) {
      delete productData._id;
    }
    
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

    // Log activity
    await logActivity(
      req.user,
      `Product added: ${product.name}`,
      "product",
      "Added",
      product._id,
      { productId: product._id, productName: product.name, price: product.price }
    );

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

    // Store product details before deletion for activity logging
    const productDetails = {
      productId: product._id,
      productName: product.name,
      price: product.price,
      category: product.category
    };

    // Attempt to delete the product image from Cloudinary if it exists
    if (product.image && product.image.includes('cloudinary')) {
      try {
        const publicId = product.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log(`Image deleted from Cloudinary: products/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Continue with deletion even if image deletion fails
      }
    }

    await Product.findByIdAndDelete(id).session(session);
    
    // Clear caches
    cache.clear();

    await session.commitTransaction();
    session.endSession();

    // Log activity after successful deletion
    await logActivity(
      req.user,
      `Product deleted: ${productDetails.productName}`,
      "product",
      "Cancelled",
      null, // No entity ID since it's deleted
      productDetails
    );

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error in deleteProduct controller:", error);
    res.status(500).json({ 
      message: "Failed to delete product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message 
    });
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
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    // Find the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Store old values for activity logging
    const oldValues = {
      name: existingProduct.name,
      price: existingProduct.price,
      category: existingProduct.category,
      isFeatured: existingProduct.isFeatured
    };
    
    // Handle image upload if new image is provided
    if (updates.image && updates.image.startsWith('data:image')) {
      try {
        const cloudinaryResponse = await cloudinary.uploader.upload(updates.image, {
          folder: "products",
          quality: "auto:good",
          fetch_format: "auto"
        });
        updates.image = cloudinaryResponse.secure_url;
        
        // Delete old image if it exists and is from Cloudinary
        if (existingProduct.image && existingProduct.image.includes('cloudinary')) {
          try {
            const publicId = existingProduct.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (cloudinaryError) {
            console.error("Error deleting old image from Cloudinary:", cloudinaryError);
          }
        }
      } catch (uploadError) {
        console.error("Failed to upload new image:", uploadError);
        delete updates.image;
      }
    } else if (!updates.image || updates.image === "") {
      // Keep the existing image if no new image is provided
      updates.image = existingProduct.image;
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    // Clear caches
    cache.clear();
    
    // Log activity with changed fields
    const changedFields = {};
    Object.keys(oldValues).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== oldValues[key]) {
        changedFields[key] = {
          from: oldValues[key],
          to: updates[key]
        };
      }
    });
    
    await logActivity(
      req.user,
      `Product updated: ${updatedProduct.name}`,
      "product",
      "Updated",
      updatedProduct._id,
      { productId: updatedProduct._id, changes: changedFields }
    );
    
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error in updateProduct controller:", error);
    res.status(500).json({
      message: "Failed to update product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

