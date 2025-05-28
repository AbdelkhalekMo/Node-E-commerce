import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, 'User is required'],
      index: true
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, 'Product is required']
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: [true, 'Price is required'],
          min: [0, 'Price cannot be negative']
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'failed', 'refunded'],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending',
      index: true
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express'],
      default: 'standard'
    },
    couponUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      sparse: true
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    notes: String,
    metadata: {
      type: Map,
      of: String
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'products.product': 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });

// Virtual field for order total with discount
orderSchema.virtual('finalAmount').get(function() {
  return this.totalAmount - this.discountAmount;
});

// Pre-save middleware to validate total amount
orderSchema.pre('save', function(next) {
  if (this.discountAmount > this.totalAmount) {
    next(new Error('Discount amount cannot be greater than total amount'));
  }
  next();
});

// Instance method to calculate order summary
orderSchema.methods.getOrderSummary = function() {
  return {
    orderId: this._id,
    totalAmount: this.totalAmount,
    discountAmount: this.discountAmount,
    finalAmount: this.finalAmount,
    status: this.status,
    paymentStatus: this.paymentStatus,
    createdAt: this.createdAt
  };
};

// Static method to get user's order history
orderSchema.statics.getUserOrderHistory = async function(userId) {
  return this.find({ user: userId })
    .select('-stripeSessionId -paymentIntentId -metadata')
    .populate('products.product', 'name image')
    .sort('-createdAt')
    .lean();
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
