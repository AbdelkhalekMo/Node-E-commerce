import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    activity: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ["order", "product", "user", "coupon", "system"],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    status: {
      type: String,
      enum: ["Completed", "Updated", "New", "Refund", "Added", "Cancelled"],
      required: true,
    },
    details: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity; 