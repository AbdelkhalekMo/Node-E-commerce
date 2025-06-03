import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { logActivity } from "./activity.controller.js";

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
    
    // Log order creation activity
    await logActivity(
      req.user,
      `New order placed: #${order._id}`,
      "order",
      "Completed",
      order._id,
      { 
        orderId: order._id,
        amount: totalAmount,
        itemCount: products.length,
        status: "processing"
      }
    );
    
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
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Store old status for activity logging
    const oldStatus = order.status;
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email")
      .populate("products.product");
    
    // Determine the activity status based on the new order status
    let activityStatus;
    switch (status) {
      case "shipped":
        activityStatus = "Updated";
        break;
      case "delivered":
        activityStatus = "Completed";
        break;
      case "cancelled":
        activityStatus = "Cancelled";
        break;
      default:
        activityStatus = "Updated";
    }
    
    // Log the status change activity
    await logActivity(
      req.user,
      `Order status updated: #${order._id} (${oldStatus} → ${status})`,
      "order",
      activityStatus,
      order._id,
      { 
        orderId: order._id,
        oldStatus,
        newStatus: status,
        amount: order.totalAmount
      }
    );
    
    res.json(updatedOrder);
  } catch (error) {
    console.log("Error in updateOrderStatus controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Store order details for activity logging
    const orderDetails = {
      orderId: order._id,
      user: order.user,
      status: order.status,
      amount: order.totalAmount,
      productCount: order.products.length
    };
    
    await Order.findByIdAndDelete(req.params.id);
    
    // Log order deletion activity
    await logActivity(
      req.user,
      `Order deleted: #${order._id}`,
      "order",
      "Cancelled",
      null, // No entity ID since it's deleted
      orderDetails
    );
    
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
    
    // Store old status for activity logging
    const oldStatus = order.status;
    
    // Update the order status to cancelled
    order.status = "cancelled";
    await order.save();
    
    // Log order cancellation activity
    await logActivity(
      req.user,
      `Order cancelled by customer: #${order._id}`,
      "order",
      "Cancelled",
      order._id,
      { 
        orderId: order._id,
        oldStatus,
        amount: order.totalAmount
      }
    );
    
    // Return the updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate("products.product");
    
    res.json(updatedOrder);
  } catch (error) {
    console.log("Error in cancelUserOrder controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 