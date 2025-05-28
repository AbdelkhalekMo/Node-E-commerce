import Stripe from "stripe";
import { config } from "./config.js";

console.log("STRIPE_SECRET_KEY:", config.stripeSecretKey);

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2023-10-16",
});
