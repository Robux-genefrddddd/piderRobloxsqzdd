import { Handler } from "@netlify/functions";

/**
 * Netlify Function: Create PayPal Order
 * POST /api/paypal/create-order
 *
 * Creates a PayPal order for purchasing a product.
 * Returns the PayPal order ID which is used on the frontend to initialize PayPal Checkout.
 */
const handler: Handler = async (event, context) => {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { productId, productName, productPrice, currency, buyerEmail } =
      JSON.parse(event.body || "{}");

    // Validate inputs
    if (
      !productId ||
      !productName ||
      !productPrice ||
      !currency ||
      !buyerEmail
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Get PayPal credentials from environment
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalMode = process.env.PAYPAL_MODE || "sandbox";

    if (!clientId || !clientSecret) {
      console.error("Missing PayPal credentials");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Payment service configuration error",
        }),
      };
    }

    const baseUrl =
      paypalMode === "production"
        ? "https://api.paypal.com"
        : "https://api.sandbox.paypal.com";

    // Step 1: Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      console.error("Failed to get PayPal access token");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to authenticate with PayPal" }),
      };
    }

    const { access_token } = await authResponse.json();

    // Step 2: Create PayPal Order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        payer: {
          email_address: buyerEmail,
        },
        purchase_units: [
          {
            reference_id: productId,
            description: productName,
            amount: {
              currency_code: currency,
              value: productPrice.toString(),
            },
            // PayPal breakdown for transparency
            items: [
              {
                name: productName,
                unit_amount: {
                  currency_code: currency,
                  value: productPrice.toString(),
                },
                quantity: "1",
              },
            ],
          },
        ],
        // Return URLs (for approval/cancellation)
        application_context: {
          return_url: `${process.env.SITE_URL || "https://yoursite.com"}/checkout/success`,
          cancel_url: `${process.env.SITE_URL || "https://yoursite.com"}/checkout/cancel`,
          brand_name: "RbxAssets",
          locale: "en-US",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.json();
      console.error("PayPal order creation failed:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Failed to create PayPal order",
          details: error,
        }),
      };
    }

    const paypalOrder = await orderResponse.json();

    // Return the PayPal order ID to frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId: paypalOrder.id,
        status: paypalOrder.status,
      }),
    };
  } catch (error: any) {
    console.error("PayPal create order error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to create order",
        message: error?.message || "Unknown error",
      }),
    };
  }
};

export { handler };
