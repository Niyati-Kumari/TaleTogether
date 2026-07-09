import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID || "dummy_key_id";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret";

export const razorpay = new Razorpay({
  key_id,
  key_secret,
});

export interface RazorpayPlanConfig {
  monthly: string;
  yearly: string;
}

export interface RazorpayConfig {
  premiumPlans: RazorpayPlanConfig;
  webhookSecret: string;
  appUrl: string;
  keyId: string;
}

export const getRazorpayConfig = (): RazorpayConfig => ({
  premiumPlans: {
    monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY || "",
    yearly: process.env.RAZORPAY_PLAN_ID_YEARLY || "",
  },
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  appUrl: process.env.VITE_APP_URL || "http://localhost:5173",
  keyId: key_id,
});
