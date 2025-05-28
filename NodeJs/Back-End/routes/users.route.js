import express from "express";
import { 
  getAllUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser 
} from "../controllers/users.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Admin only routes
router.get("/", protectRoute, adminRoute, getAllUsers);
router.get("/:id", protectRoute, adminRoute, getUserById);
router.patch("/:id/role", protectRoute, adminRoute, updateUserRole);
router.delete("/:id", protectRoute, adminRoute, deleteUser);

export default router; 