import { Handler } from "@netlify/functions";
import { db } from "../../server/firebase-admin";

/**
 * Netlify Function: Process PayPal Payouts
 * POST /api/paypal/payout
 *
 * Sends accumulated seller earnings to their PayPal account.
 * Batches payouts for efficiency.
 * Called periodically (e.g., daily or weekly) or manually triggered.
 *
 * IMPORTANT: In production, sellers must have verified PayPal accounts
 * tied to their email addresses in your system.
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

    const { sellerId, amount, currency, email } = JSON.parse(
      event.body || "{}",
    );

    if (!sellerId || !amount || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields (sellerId, amount, email)",
        }),
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

    // Step 2: Create payout
    // Minimum payout is $0.10 and maximum varies by country
    if (amount < 0.1) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Minimum payout amount is $0.10",
        }),
      };
    }

    const payoutResponse = await fetch(`${baseUrl}/v1/payments/payouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `batch-${Date.now()}-${sellerId}`,
          email_subject: "RbxAssets - Your Seller Earnings",
          email_message:
            "You have received earnings from your product sales on RbxAssets.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: {
              value: amount.toFixed(2),
              currency: currency || "USD",
            },
            receiver: email,
            note: `Seller earnings from RbxAssets`,
            sender_item_id: `item-${sellerId}-${Date.now()}`,
          },
        ],
      }),
    });

    if (!payoutResponse.ok) {
      const error = await payoutResponse.json();
      console.error("PayPal payout failed:", error);

      // Update payout status to failed in Firestore
      const payoutsRef = db
        .collection("payouts")
        .where("sellerId", "==", sellerId)
        .where("status", "==", "pending")
        .limit(1);

      const payoutDocs = await payoutsRef.get();
      if (!payoutDocs.empty) {
        await payoutDocs.docs[0].ref.update({
          status: "failed",
          errorMessage: error.message || "PayPal payout failed",
          updatedAt: new Date(),
        });
      }

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Failed to process payout",
          details: error,
        }),
      };
    }

    const payoutData = await payoutResponse.json();
    const payoutBatchId = payoutData.batch_header.payout_batch_id;

    // Step 3: Update Firestore with payout ID
    const payoutsRef = db
      .collection("payouts")
      .where("sellerId", "==", sellerId)
      .where("status", "==", "pending");

    const payoutDocs = await payoutsRef.get();
    let updatedCount = 0;

    for (const doc of payoutDocs.docs) {
      if (doc.data().amount <= amount) {
        await doc.ref.update({
          paypalPayoutId: payoutBatchId,
          status: "processing",
          updatedAt: new Date(),
        });
        updatedCount++;
      }
    }

    // Return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        payoutBatchId,
        status: "processing",
        amount,
        currency,
        message: `Payout initiated successfully. ${updatedCount} payout(s) marked as processing.`,
      }),
    };
  } catch (error: any) {
    console.error("PayPal payout error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process payout",
        message: error?.message || "Unknown error",
      }),
    };
  }
};

export { handler };
