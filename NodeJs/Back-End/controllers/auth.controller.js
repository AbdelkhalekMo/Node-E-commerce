import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { config } from "../lib/config.js";
import { logActivity } from "./activity.controller.js";

const generateTokens = (userId) => {
        const accessToken = jwt.sign({ userId }, config.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, config.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
};


const setCookies = (res, accessToken, refreshToken) => {
    // Set access token cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: "lax", // Use 'none' in production with HTTPS
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/'
    });
    
    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: "lax", // Use 'none' in production with HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
    });
    
    console.log('Cookies set:', {
        accessToken: 'token-set',
        refreshToken: 'token-set',
        options: {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: '/'
        }
    });
};

export const signup = async (req, res) => {
    const { email, password, name } = req.body;
    try {
        console.log(`[Signup Attempt] Received request for email: ${email}`);
        const userExists = await User.findOne({ email });
        console.log(`[Signup Attempt] User.findOne result for ${email}:`, userExists);

        if (userExists) {
            console.log(`[Signup Attempt] User ${email} found in DB. Returning 400.`);
            return res.status(400).json({ message: "User already exists" });
        }
        console.log(`[Signup Attempt] User ${email} NOT found. Proceeding to create user.`);
        const user = await User.create({ name, email, password });

        const { accessToken, refreshToken } = generateTokens(user._id);

        setCookies(res, accessToken, refreshToken);

        // Log user registration activity
        await logActivity(
            user, // Using the newly created user as the actor
            `New user registered: ${email}`,
            "user",
            "New",
            user._id,
            { 
                userId: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        );

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[Login Attempt] Received request for email: ${email}`);
        const user = await User.findOne({ email });
        console.log(`[Login Attempt] User.findOne result for ${email}:`, user ? user.email : null);

        if (user) {
            console.log(`[Login Attempt] User found. Comparing password for ${email}...`);
            const isPasswordMatch = await user.comparePassword(password);
            console.log(`[Login Attempt] Password match result for ${email}: ${isPasswordMatch}`);
            if (isPasswordMatch) {
                console.log(`[Login Attempt] Password matched for ${email}. Generating tokens...`);
                const { accessToken, refreshToken } = generateTokens(user._id);

                setCookies(res, accessToken, refreshToken);

                // Log successful login activity
                await logActivity(
                    user,
                    `User logged in: ${email}`,
                    "user",
                    "Completed",
                    user._id,
                    { 
                        userId: user._id,
                        email: user.email
                    }
                );

                res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                });
            } else {
                console.log(`[Login Attempt] Invalid password for ${email}.`);
                res.status(400).json({ message: "Invalid email or password" });
            }
        } else {
            console.log(`[Login Attempt] User ${email} not found.`);
            res.status(400).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        // Log logout activity if user is authenticated
        if (req.user) {
            await logActivity(
                req.user,
                `User logged out: ${req.user.email}`,
                "user",
                "Completed",
                req.user._id,
                { 
                    userId: req.user._id,
                    email: req.user.email
                }
            );
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const refreshTokenFromCookie = req.cookies.refreshToken;

        if (!refreshTokenFromCookie) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshTokenFromCookie, config.REFRESH_TOKEN_SECRET);

        // Generate a new access token
        const accessToken = jwt.sign({ userId: decoded.userId }, config.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        
        // Also generate a new refresh token to extend the session
        const refreshToken = jwt.sign({ userId: decoded.userId }, config.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        // Set both cookies with updated expiration times
        setCookies(res, accessToken, refreshToken);

        res.json({ message: "Token refreshed successfully" });
    } catch (error) {
        console.log("Error in refreshToken controller", error.message);
        res.status(401).json({ message: "Invalid refresh token", error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, email, username } = req.body;
        const userId = req.user._id;

        // Check if email is already in use by another user
        if (email !== req.user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(400).json({ message: "Email is already in use" });
            }
        }

        // Check if username is already in use by another user
        if (username && username !== req.user.username) {
            const usernameExists = await User.findOne({ username, _id: { $ne: userId } });
            if (usernameExists) {
                return res.status(400).json({ message: "Username is already in use" });
            }
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                name: name || req.user.name,
                email: email || req.user.email,
                username: username || req.user.username,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.log("Error in updateProfile controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Find user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isPasswordMatch = await user.comparePassword(currentPassword);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.log("Error in changePassword controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};