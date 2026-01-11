import { Handler } from "@netlify/functions";
import { db } from "../../server/firebase-admin";

/**
 * Netlify Function: Capture PayPal Order
 * POST /api/paypal/capture-order
 *
 * Captures the payment, stores order in Firestore, and initiates seller payout.
 * Revenue split: 30% platform, 70% seller
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

    const {
      paypalOrderId,
      productId,
      productName,
      productPrice,
      currency,
      buyerId,
      buyerEmail,
      creatorId,
      creatorName,
      creatorEmail,
    } = JSON.parse(event.body || "{}");

    // Validate inputs
    if (
      !paypalOrderId ||
      !productId ||
      !productPrice ||
      !buyerId ||
      !creatorId
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const paypalMode = process.env.PAYPAL_MODE || "sandbox";

    if (!clientId || !clientSecret) {
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
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to authenticate with PayPal" }),
      };
    }

    const { access_token } = await authResponse.json();

    // Step 2: Capture the PayPal order
    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.json();
      console.error("PayPal capture failed:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Failed to capture payment",
          details: error,
        }),
      };
    }

    const captureData = await captureResponse.json();
    const paymentStatus = captureData.status;

    // Check if payment was successfully captured
    if (paymentStatus !== "COMPLETED") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Payment not completed",
          status: paymentStatus,
        }),
      };
    }

    // Step 3: Calculate split
    const totalAmount = parseFloat(productPrice);
    const platformFee = Math.round(totalAmount * 0.3 * 100) / 100; // 30%
    const sellerAmount = Math.round(totalAmount * 0.7 * 100) / 100; // 70%

    // Step 4: Store order in Firestore
    const ordersCollection = db.collection("paymentOrders");
    const orderDoc = await ordersCollection.add({
      paypalOrderId,
      buyerId,
      buyerEmail,
      productId,
      productName,
      productPrice: totalAmount,
      currency,
      creatorId,
      creatorName,
      creatorEmail,
      totalAmount,
      platformFee,
      sellerAmount,
      status: "completed",
      paypalStatus: paymentStatus,
      capturedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const orderId = orderDoc.id;

    // Step 5: Initiate seller payout (in real production, use PayPal Payouts API)
    // For now, we store it and can batch process later
    const payoutsCollection = db.collection("payouts");
    await payoutsCollection.add({
      orderId,
      sellerId: creatorId,
      sellerEmail: creatorEmail,
      amount: sellerAmount,
      currency,
      paypalPayoutId: "", // Will be filled after payout
      status: "pending",
      createdAt: new Date(),
    });

    // Step 6: Update product sales count (optional)
    const productsCollection = db.collection("products");
    await productsCollection.doc(productId).update({
      sales: (await productsCollection.doc(productId).get()).data()?.sales || 0 + 1,
      totalRevenue:
        ((await productsCollection.doc(productId).get()).data()?.totalRevenue ||
          0) + sellerAmount,
      updatedAt: new Date(),
    });

    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId,
        paypalOrderId,
        status: "completed",
        totalAmount,
        platformFee,
        sellerAmount,
        message: "Payment captured successfully",
      }),
    };
  } catch (error: any) {
    console.error("PayPal capture order error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to capture order",
        message: error?.message || "Unknown error",
      }),
    };
  }
};

export { handler };
