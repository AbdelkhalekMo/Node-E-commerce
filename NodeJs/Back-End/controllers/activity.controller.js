import Activity from "../models/activity.model.js";
import User from "../models/user.model.js";

// Create a new activity record
export const createActivity = async (activityData) => {
  try {
    const newActivity = new Activity(activityData);
    return await newActivity.save();
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
};

// Helper function to create activity with all required fields
export const logActivity = async (user, activity, entityType, status, entityId = null, details = {}) => {
  try {
    // If user is provided as an object with _id
    const userId = user._id ? user._id : user;
    let userEmail = "";

    // Fetch user email if not provided directly
    if (user.email) {
      userEmail = user.email;
    } else {
      const userObj = await User.findById(userId);
      userEmail = userObj ? userObj.email : "unknown@example.com";
    }

    return await createActivity({
      activity,
      user: userId,
      userEmail,
      entityType,
      entityId,
      status,
      details,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging should not break the main operation
  }
};

// Get recent activities with pagination
export const getRecentActivities = async (limit = 10, skip = 0) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "name email",
      });

    return activities.map((activity) => ({
      _id: activity._id,
      date: activity.createdAt,
      activity: activity.activity,
      user: activity.userEmail,
      status: activity.status,
      entityType: activity.entityType,
      entityId: activity.entityId,
      details: activity.details,
    }));
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

// Get activities related to a specific entity
export const getEntityActivities = async (entityType, entityId, limit = 10) => {
  try {
    const activities = await Activity.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "user",
        select: "name email",
      });

    return activities.map((activity) => ({
      _id: activity._id,
      date: activity.createdAt,
      activity: activity.activity,
      user: activity.userEmail,
      status: activity.status,
      details: activity.details,
    }));
  } catch (error) {
    console.error(`Error fetching ${entityType} activities:`, error);
    throw error;
  }
}; 