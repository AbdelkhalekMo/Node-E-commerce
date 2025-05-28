import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import { getAnalyticsData, getDailySalesData } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, async (req, res) => {
	try {
		const analyticsData = await getAnalyticsData();

		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

		const dailySalesData = await getDailySalesData(startDate, endDate);

		res.json({
			analyticsData,
			dailySalesData,
		});
	} catch (error) {
		console.log("Error in analytics route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Dashboard stats for admin
router.get("/dashboard-stats", protectRoute, adminRoute, async (req, res) => {
	try {
		const analyticsData = await getAnalyticsData();
		
		res.json({
			totalProducts: analyticsData.totalProducts || 0,
			totalOrders: analyticsData.totalOrders || 0,
			totalUsers: analyticsData.totalUsers || 0,
			revenue: analyticsData.totalRevenue || 0
		});
	} catch (error) {
		console.log("Error in dashboard stats route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

// Recent activities for admin dashboard
router.get("/recent-activities", protectRoute, adminRoute, async (req, res) => {
	try {
		const now = new Date();
		// Mock data for now - in a real app, this would come from a database
		const activities = [
			{
				date: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
				activity: 'New order placed',
				user: 'customer123@example.com',
				status: 'Completed'
			},
			{
				date: new Date(now.getTime() - 120 * 60 * 1000), // 2 hours ago
				activity: 'Product stock updated',
				user: 'admin@example.com',
				status: 'Updated'
			},
			{
				date: new Date(now.getTime() - 240 * 60 * 1000), // 4 hours ago
				activity: 'New user registered',
				user: 'newuser@example.com',
				status: 'New'
			},
			{
				date: new Date(now.getTime() - 300 * 60 * 1000), // 5 hours ago
				activity: 'Order refunded',
				user: 'customer456@example.com',
				status: 'Refund'
			},
			{
				date: new Date(now.getTime() - 360 * 60 * 1000), // 6 hours ago
				activity: 'Product added',
				user: 'admin@example.com',
				status: 'Added'
			}
		];
		
		res.json(activities);
	} catch (error) {
		console.log("Error in recent activities route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

export default router;
