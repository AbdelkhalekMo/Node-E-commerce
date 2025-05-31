import express from "express";
import { 
  createOrder, 
  getOrderById, 
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  cancelUserOrder
} from "../controllers/order.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// User routes
router.post("/", protectRoute, createOrder);
router.get("/user", protectRoute, getUserOrders);
router.get("/:id", protectRoute, getOrderById);
router.patch("/:id/cancel", protectRoute, cancelUserOrder);

// Admin routes
router.get("/", protectRoute, adminRoute, getAllOrders);
router.patch("/:id", protectRoute, adminRoute, updateOrderStatus);
router.delete("/:id", protectRoute, adminRoute, deleteOrder);

export default router; 