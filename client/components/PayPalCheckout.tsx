import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Asset } from "@/lib/assetService";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "@/components/ui/loader";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalCheckoutProps {
  product: Asset;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
}

export function PayPalCheckout({
  product,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const { user, userProfile } = useAuth();
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load PayPal script
    const loadPayPalScript = async () => {
      try {
        // Check if PayPal SDK is already loaded
        if (window.paypal) {
          initializePayPal();
          return;
        }

        // Load PayPal SDK
        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;
        script.onload = () => {
          initializePayPal();
        };
        script.onerror = () => {
          setError("Failed to load PayPal SDK");
          setLoading(false);
        };
        document.body.appendChild(script);
      } catch (err) {
        setError("Failed to initialize PayPal");
        setLoading(false);
      }
    };

    loadPayPalScript();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const initializePayPal = async () => {
    if (!window.paypal || !paypalContainerRef.current) {
      setLoading(false);
      return;
    }

    try {
      window.paypal
        .Buttons({
          createOrder: async (data: any, actions: any) => {
            // Call backend to create PayPal order
            try {
              const response = await fetch(
                "/.netlify/functions/paypal-create-order",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    productId: product.id,
                    productName: product.name,
                    productPrice: product.price || 0,
                    currency: "USD",
                    buyerEmail: userProfile?.email || user?.email || "",
                  }),
                },
              );

              if (!response.ok) {
                throw new Error("Failed to create PayPal order");
              }

              const { orderId } = await response.json();
              return orderId;
            } catch (err: any) {
              toast.error(err?.message || "Failed to create order");
              throw err;
            }
          },

          onApprove: async (data: any, actions: any) => {
            // Call backend to capture the order
            try {
              setLoading(true);
              const response = await fetch(
                "/.netlify/functions/paypal-capture-order",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    paypalOrderId: data.orderID,
                    productId: product.id,
                    productName: product.name,
                    productPrice: product.price || 0,
                    currency: "USD",
                    buyerId: user?.uid,
                    buyerEmail: userProfile?.email || user?.email || "",
                    creatorId: product.authorId,
                    creatorName: product.authorName,
                    creatorEmail: "", // Will be fetched from DB
                  }),
                },
              );

              if (!response.ok) {
                throw new Error("Failed to capture payment");
              }

              const result = await response.json();
              toast.success(`Payment successful! Order ID: ${result.orderId}`);

              if (onSuccess) {
                onSuccess(result.orderId);
              }

              // Redirect or handle success
              setTimeout(() => {
                window.location.href = `/order/${result.orderId}`;
              }, 1500);
            } catch (err: any) {
              toast.error(err?.message || "Failed to process payment");
              if (onError) {
                onError(err?.message || "Payment error");
              }
            } finally {
              setLoading(false);
            }
          },

          onError: (err: any) => {
            console.error("PayPal error:", err);
            toast.error("Payment error. Please try again.");
            if (onError) {
              onError(err?.message || "Unknown error");
            }
          },

          onCancel: (data: any) => {
            toast.info("Payment cancelled");
          },
        })
        .render(paypalContainerRef.current);

      setLoading(false);
    } catch (err: any) {
      console.error("PayPal initialization error:", err);
      setError(err?.message || "Failed to initialize PayPal");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-sm text-yellow-600">
          Please sign in to make a purchase
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return <div ref={paypalContainerRef} className="w-full" />;
}
