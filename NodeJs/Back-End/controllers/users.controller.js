import User from "../models/user.model.js";
import { logActivity } from "./activity.controller.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.log("Error in getAllUsers controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.log("Error in getUserById controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !["admin", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }
    
    const userToUpdate = await User.findById(req.params.id).select("-password");
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Store old role for activity logging
    const oldRole = userToUpdate.role;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    
    // Log the role change activity
    await logActivity(
      req.user,
      `User role updated: ${updatedUser.email} (${oldRole} → ${role})`,
      "user",
      "Updated",
      updatedUser._id,
      { 
        userId: updatedUser._id,
        email: updatedUser.email,
        oldRole,
        newRole: role
      }
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.log("Error in updateUserRole controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Store user details for activity logging
    const userDetails = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };
    
    await User.findByIdAndDelete(req.params.id);
    
    // Log user deletion activity
    await logActivity(
      req.user,
      `User deleted: ${user.email}`,
      "user",
      "Cancelled",
      null, // No entity ID since it's deleted
      userDetails
    );
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 