import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Author, SubscriptionPlan } from "../types";

interface SubscriptionPageProps {
  subscriptionPlans: SubscriptionPlan[];
  currentUser: Author | null;
  onSubscribe?: (planId: string) => Promise<void>;
}

export const SubscriptionPage = ({
  subscriptionPlans,
  currentUser,
}: SubscriptionPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setSuccess(true);
    }
    if (searchParams.get("canceled") === "true") {
      setCanceled(true);
    }
    // Clear params after displaying
    setTimeout(() => {
      setSearchParams({});
    }, 5000);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // Dynamically load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    setIsProcessing(true);
    try {
      const result = await api.createRazorpaySubscription(billingCycle);
      
      if (!result.subscriptionId || !result.keyId) {
        throw new Error("Invalid response from server");
      }

      const options = {
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "TaleTogether Premium",
        description: `Premium ${billingCycle} subscription`,
        handler: function (response: any) {
          // You could verify the payment on the backend here, or rely on webhooks
          window.location.href = "/subscribe?success=true";
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setSelectedPlan(null);
            window.location.href = "/subscribe?canceled=true";
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        console.error("Payment failed", response.error);
        alert(response.error.description || "Payment failed");
        setIsProcessing(false);
        setSelectedPlan(null);
      });
      rzp.open();
    } catch (error) {
      console.error("Subscription error:", error);
      alert(error instanceof Error ? error.message : "Failed to start checkout. Please check your Razorpay configuration.");
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <main className="page">
      <section className="content-section">
        {success && (
          <div className="success-message" style={{
            padding: '1rem',
            backgroundColor: '#4ade80',
            color: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <h3>Welcome to Premium! 🎉</h3>
            <p>Your subscription has been activated successfully.</p>
          </div>
        )}
        {canceled && (
          <div className="cancel-message" style={{
            padding: '1rem',
            backgroundColor: '#f87171',
            color: 'white',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            <h3>Subscription Canceled</h3>
            <p>No worries! You can subscribe anytime.</p>
          </div>
        )}
        <header className="section-header">
          <h1>Upgrade to TaleTogether Premium</h1>
          <p className="muted">Unlock exclusive features and support your favorite writers</p>
        </header>

        <div className="subscription-toggle-container">
          <button
            type="button"
            className={`toggle-button ${billingCycle === "monthly" ? "active" : ""}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`toggle-button ${billingCycle === "yearly" ? "active" : ""}`}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly <span className="badge">Save 20%</span>
          </button>
        </div>

        <div className="subscription-plans-grid">
          {subscriptionPlans
            .filter((plan) => plan.billingCycle === billingCycle)
            .map((plan) => (
              <article
                key={plan.id}
                className={`subscription-plan-card ${
                  plan.name.toLowerCase().includes("premium") ? "featured" : ""
                }`}
              >
                {plan.name.toLowerCase().includes("premium") && (
                  <div className="plan-badge">Most Popular</div>
                )}
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <p className="plan-description">{plan.description}</p>
                </div>
                <div className="plan-price">
                  <span className="price-currency">$</span>
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">/{billingCycle.slice(0, -2)}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature} className="plan-feature">
                      <span className="feature-icon">✓</span>
                      <span className="feature-text">
                        {feature.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`button ${
                    plan.name.toLowerCase().includes("premium")
                      ? "primary"
                      : "secondary"
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan === plan.id
                    ? "Processing..."
                    : currentUser?.subscriptionTier === "premium"
                      ? "Current Plan"
                      : "Subscribe Now"}
                </button>
              </article>
            ))}
        </div>

        <div className="subscription-benefits-section">
          <h2>Why Go Premium?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <h3>Unlimited AI Assist</h3>
              <p>Get unlimited writing help from our AI assistant</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">✨</div>
              <h3>Exclusive Challenges</h3>
              <p>Participate in premium writing contests with bigger prizes</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⭐</div>
              <h3>Early Access</h3>
              <p>Read new stories before everyone else</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎉</div>
              <h3>Ad-Free Experience</h3>
              <p>Enjoy reading without any interruptions</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
