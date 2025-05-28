import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const getCartProducts = async (req, res) => {
	try {
		// Check if user has cart items
		if (!req.user.cartItems || req.user.cartItems.length === 0) {
			console.log("User has no cart items");
			return res.json([]);
		}

		// Extract product IDs from cart items
		const productIds = req.user.cartItems.map(item => {
			// Ensure we have a valid product reference
			return item.product ? item.product : null;
		}).filter(id => id !== null); // Filter out any null values
		
		console.log("Product IDs in cart:", productIds);
		
		if (productIds.length === 0) {
			console.log("No valid product IDs found in cart");
			return res.json([]);
		}
		
		// Find all products in the cart
		const products = await Product.find({ 
			_id: { $in: productIds }
		}).lean();

		console.log("Found products:", products.length);

		// Map products to cart items with quantities
		const cartItems = req.user.cartItems.map(cartItem => {
			if (!cartItem.product) {
				console.log("Cart item has no product reference");
				return null;
			}
			
			const productId = cartItem.product.toString(); // Convert to string for comparison
			const product = products.find(p => p._id.toString() === productId);
			
			if (!product) {
				console.log("Product not found for ID:", productId);
				return null; // Skip if product not found
			}

			return {
				_id: cartItem._id.toString(), // Convert ObjectId to string
				productId: productId, // Already converted to string
				product: {
					...product,
					_id: product._id.toString() // Ensure product _id is a string
				},
				quantity: cartItem.quantity || 1
			};
		}).filter(item => item !== null); // Remove null items

		console.log("Sending cart items:", cartItems.length);
		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId, quantity = 1 } = req.body;
		const user = req.user;

		console.log('Add to cart request received:', { productId, quantity });
		console.log('User object:', JSON.stringify(user));

		if (!productId) {
			return res.status(400).json({ message: "Product ID is required" });
		}

		// Validate productId format
		if (!mongoose.Types.ObjectId.isValid(productId)) {
			console.log('Invalid product ID format:', productId);
			return res.status(400).json({ message: "Invalid product ID format" });
		}

		// Validate product exists
		const product = await Product.findById(productId);
		if (!product) {
			console.log('Product not found:', productId);
			return res.status(404).json({ message: "Product not found" });
		}

		console.log('Product found:', product._id);
		
		try {
			// Convert productId to ObjectId
			const productObjectId = new mongoose.Types.ObjectId(productId);
			
			// Parse quantity to ensure it's a number
			const parsedQuantity = parseInt(quantity);
			if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
				return res.status(400).json({ message: "Invalid quantity" });
			}

			// Find if product already exists in cart
			const existingItemIndex = user.cartItems.findIndex(
				item => item.product && item.product.toString() === productObjectId.toString()
			);

			console.log('Existing item index:', existingItemIndex);

			if (existingItemIndex >= 0) {
				// Update quantity if product already in cart
				user.cartItems[existingItemIndex].quantity += parsedQuantity;
				console.log('Updated quantity for existing item:', user.cartItems[existingItemIndex]);
			} else {
				// Add new product to cart
				user.cartItems.push({
					product: productObjectId,
					quantity: parsedQuantity
				});
				console.log('Added new item to cart');
			}

			await user.save();
			console.log('User saved successfully');

			// Return updated cart
			const updatedCart = await getUpdatedCart(user);
			console.log('Updated cart:', updatedCart);
			res.json(updatedCart);
		} catch (err) {
			console.log('Error processing ObjectId:', err);
			return res.status(400).json({ message: "Invalid product ID format" });
		}
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		console.log("Full error:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		
		if (!productId) {
			// Clear entire cart
			user.cartItems = [];
		} else {
			// Remove specific product
			user.cartItems = user.cartItems.filter(
				item => item.product && item.product.toString() !== productId.toString()
			);
		}
		
		await user.save();
		
		// Return updated cart
		const updatedCart = await getUpdatedCart(user);
		res.json(updatedCart);
	} catch (error) {
		console.log("Error in removeAllFromCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: itemId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		
		// Find the cart item
		const itemIndex = user.cartItems.findIndex(
			item => item._id && item._id.toString() === itemId.toString()
		);

		if (itemIndex === -1) {
			return res.status(404).json({ message: "Cart item not found" });
		}

		// Parse quantity to ensure it's a number
		const parsedQuantity = parseInt(quantity);
		if (isNaN(parsedQuantity)) {
			return res.status(400).json({ message: "Invalid quantity" });
		}

		if (parsedQuantity <= 0) {
			// Remove item if quantity is zero or negative
			user.cartItems.splice(itemIndex, 1);
		} else {
			// Update quantity
			user.cartItems[itemIndex].quantity = parsedQuantity;
		}

		await user.save();
		
		// Return updated cart
		const updatedCart = await getUpdatedCart(user);
		res.json(updatedCart);
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Helper function to get updated cart with product details
async function getUpdatedCart(user) {
	try {
		if (!user.cartItems || user.cartItems.length === 0) {
			return [];
		}
		
		// Extract product IDs, filtering out any invalid references
		const productIds = user.cartItems
			.filter(item => item.product) // Ensure product exists
			.map(item => item.product);    // Get the product reference
		
		if (productIds.length === 0) {
			return [];
		}
		
		// Find all products in the cart
		const products = await Product.find({ 
			_id: { $in: productIds }
		}).lean();

		// Map products to cart items with quantities
		return user.cartItems
			.filter(cartItem => cartItem.product) // Ensure product exists
			.map(cartItem => {
				const productId = cartItem.product.toString(); // Convert to string for comparison
				const product = products.find(p => p._id.toString() === productId);
				
				if (!product) {
					return null; // Skip if product not found
				}

				return {
					_id: cartItem._id.toString(), // Convert ObjectId to string
					productId: productId, // Already converted to string
					product: {
						...product,
						_id: product._id.toString() // Ensure product _id is a string
					},
					quantity: cartItem.quantity || 1
				};
			})
			.filter(item => item !== null); // Remove null items
	} catch (error) {
		console.log("Error in getUpdatedCart helper", error.message);
		return [];
	}
}
