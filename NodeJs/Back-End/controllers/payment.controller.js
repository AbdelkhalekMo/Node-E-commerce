import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

const MINIMUM_AMOUNT_FOR_COUPON = 20000; // $200 in cents

// Validate products helper
const validateProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("Invalid or empty products array");
  }
  
  products.forEach(product => {
    if (!product._id || !product.name || !product.price || !product.quantity) {
      throw new Error(`Invalid product data: ${JSON.stringify(product)}`);
    }
    if (product.price <= 0 || product.quantity <= 0) {
      throw new Error(`Invalid price or quantity for product: ${product.name}`);
    }
  });
};

export const createCheckoutSession = async (req, res) => {
  const session = await stripe.checkout.sessions.create({}).catch(() => null); // Start transaction
  
  try {
    const { products, couponCode } = req.body;
    
    // Validate request data
    validateProducts(products);
    
    let totalAmount = 0;
    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += amount * product.quantity;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product.image].filter(Boolean), // Filter out null/undefined images
            metadata: { productId: product._id.toString() }
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    // Validate total amount
    if (totalAmount <= 0) {
      throw new Error("Invalid total amount");
    }

    // Process coupon in a separate try-catch to handle specific coupon errors
    let coupon = null;
    try {
      if (couponCode) {
        coupon = await Coupon.findOne({ 
          code: couponCode,
          userId: req.user._id,
          isActive: true,
          expirationDate: { $gt: new Date() }
        }).lean();
        
        if (coupon) {
          totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
        } else {
          return res.status(400).json({ message: "Invalid or expired coupon" });
        }
      }
    } catch (error) {
      console.error("Error processing coupon:", error);
      return res.status(400).json({ message: "Error processing coupon" });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      customer_email: req.user.email, // Add customer email if available
      discounts: coupon
        ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p._id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    // Create reward coupon if eligible
    if (totalAmount >= MINIMUM_AMOUNT_FOR_COUPON) {
      try {
        await createNewCoupon(req.user._id);
      } catch (error) {
        console.error("Error creating reward coupon:", error);
        // Don't fail the checkout if reward coupon creation fails
      }
    }

    res.status(200).json({ 
      id: checkoutSession.id, 
      totalAmount: totalAmount / 100,
      estimatedTotal: checkoutSession.amount_total / 100
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    // If we had started a session, try to cancel it
    if (session?.id) {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error("Error expiring session:", expireError);
      }
    }
    res.status(error.name === "StripeError" ? 402 : 400).json({ 
      message: "Error processing checkout", 
      error: process.env.NODE_ENV === "production" ? undefined : error.message 
    });
  }
};

export const checkoutSuccess = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    // Retrieve and validate the session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Verify payment status
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Begin transaction
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Deactivate coupon if used
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate(
          {
            code: session.metadata.couponCode,
            userId: session.metadata.userId,
            isActive: true
          },
          { isActive: false },
          { session: dbSession }
        );
      }

      // Create new order
      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        user: session.metadata.userId,
        products: products.map((product) => ({
          product: product.id,
          quantity: product.quantity,
          price: product.price,
        })),
        totalAmount: session.amount_total / 100,
        stripeSessionId: sessionId,
        paymentIntentId: session.payment_intent,
        paymentStatus: session.payment_status,
        shippingAddress: session.shipping?.address,
      });

      await newOrder.save({ session: dbSession });
      await dbSession.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Payment successful and order created",
        orderId: newOrder._id,
      });
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error("Error processing successful checkout:", error);
    res.status(500).json({ 
      message: "Error processing successful checkout",
      error: process.env.NODE_ENV === "production" ? undefined : error.message
    });
  }
};

async function createStripeCoupon(discountPercentage) {
  try {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: "once",
      metadata: { source: 'e-commerce-app' }
    });

    return coupon.id;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    throw new Error("Failed to create discount coupon");
  }
}

async function createNewCoupon(userId) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Delete old coupon if exists
    await Coupon.findOneAndDelete({ userId }, { session: dbSession });

    // Create new coupon
    const newCoupon = new Coupon({
      code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userId: userId,
    });

    await newCoupon.save({ session: dbSession });
    await dbSession.commitTransaction();
    return newCoupon;
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
}
