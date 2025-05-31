import Order from "../models/order.model.js";
import User from "../models/user.model.js";

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    
    console.log("Create order request received:", req.body);
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }
    
    // Map items to products array expected by the model
    const products = items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: item.price
    }));
    
    console.log("Mapped products:", products);
    
    const order = await Order.create({
      user: req.user._id,
      products, // Use products array instead of items
      totalAmount,
      shippingAddress: {
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || '',
        country: shippingAddress.country,
        zipCode: shippingAddress.postalCode
      },
      status: "processing", // Match the status field in the model
      paymentStatus: "pending", // Set initial payment status
      shippingMethod: "standard"
    });
    
    console.log("Order created successfully:", order._id);
    
    // Clear user's cart after successful order
    req.user.cartItems = [];
    await req.user.save();
    
    res.status(201).json(order);
  } catch (error) {
    console.log("Error in createOrder controller", error.message);
    console.log("Error details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the order belongs to the user or if user is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }
    
    console.log("Retrieved order:", order);
    res.json(order);
  } catch (error) {
    console.log("Error in getOrderById controller", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("products.product");
    
    res.json(orders);
  } catch (error) {
    console.log("Error in getUserOrders controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("products.product");
    
    res.json(orders);
  } catch (error) {
    console.log("Error in getAllOrders controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !["processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email")
      .populate("products.product");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.log("Error in updateOrderStatus controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.log("Error in deleteOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelUserOrder = async (req, res) => {
  try {
    // Find the order by ID
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the order belongs to the current user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }
    
    // Check if the order is in a cancellable state
    if (order.status !== "pending" && order.status !== "processing") {
      return res.status(400).json({ 
        message: "Cannot cancel this order. Only orders with 'pending' or 'processing' status can be cancelled."
      });
    }
    
    // Update the order status to cancelled
    order.status = "cancelled";
    await order.save();
    
    // Return the updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate("products.product");
    
    res.json(updatedOrder);
  } catch (error) {
    console.log("Error in cancelUserOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 