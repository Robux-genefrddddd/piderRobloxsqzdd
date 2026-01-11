# PayPal Payment System Setup Guide

## 🔐 SECURITY FIRST - Environment Variables

**NEVER commit PayPal credentials to Git!**

### Required Environment Variables

```bash
# PayPal Credentials (from PayPal Developer Dashboard)
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_key_here
PAYPAL_MODE=sandbox  # Use "sandbox" for testing, "production" for live

# Site Configuration
SITE_URL=https://yourdomain.com  # For redirect URLs
VITE_PAYPAL_CLIENT_ID=your_client_id_here  # Public client ID for frontend
```

### How to Set These in Netlify:

1. Go to your Netlify project settings
2. Navigate to **Environment** → **Environment variables**
3. Add each variable with its value
4. Redeploy your site

## 🏗️ DATABASE SCHEMA

### Collections in Firestore:

#### 1. `products`

```typescript
{
  id: string; // Auto-generated
  name: string;
  description: string;
  price: number; // Price in USD/EUR
  currency: "USD" | "EUR";
  authorId: string; // Creator's user ID
  authorName: string;
  imageUrl: string;
  status: "draft" | "published" | "archived";
  sales: number; // Number of sales
  totalRevenue: number; // Total seller earnings
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `paymentOrders`

```typescript
{
  id: string; // Firestore doc ID
  paypalOrderId: string; // PayPal's order ID
  buyerId: string; // Buyer's user ID
  buyerEmail: string;
  productId: string;
  productName: string;
  productPrice: number;
  currency: "USD" | "EUR";
  creatorId: string; // Seller's user ID
  creatorName: string;
  totalAmount: number; // 100%
  platformFee: number; // 30%
  sellerAmount: number; // 70%
  status: "pending" | "approved" | "completed" | "failed";
  paypalStatus: string; // PayPal status
  createdAt: Timestamp;
  capturedAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 3. `payouts`

```typescript
{
  id: string;                    // Firestore doc ID
  orderId: string;               // Related payment order
  sellerId: string;              // Seller's user ID
  sellerEmail: string;
  amount: number;                // 70% amount
  currency: "USD" | "EUR";
  paypalPayoutId: string;        // PayPal payout batch ID
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Timestamp;
  completedAt?: Timestamp;
  errorMessage?: string;
}
```

## 🔄 PAYMENT FLOW

```
1. BUYER INITIATES PURCHASE
   ↓
2. Frontend calls: /.netlify/functions/paypal-create-order
   - Creates PayPal Order on PayPal's servers
   - Returns PayPal Order ID
   ↓
3. PayPal Checkout Dialog appears
   - User logs in to PayPal
   - Confirms payment
   - Approves payment
   ↓
4. Frontend calls: /.netlify/functions/paypal-capture-order
   - Captures payment on PayPal
   - Creates order in Firestore (paymentOrders)
   - Creates payout entry in Firestore (payouts)
   - Updates product sales count
   ↓
5. PAYOUT PROCESSING (Daily/Weekly via cron job)
   - Admin/Cron calls: /.netlify/functions/paypal-payout
   - Processes pending payouts to sellers
   - Updates payout status
   ↓
6. SELLER RECEIVES FUNDS
   - 70% sent to seller's PayPal account
   - Platform keeps 30%
```

## 💰 REVENUE SPLIT CALCULATION

```
Example: Product price = $100 USD

Total Amount:    $100.00
Platform Fee:    -$30.00 (30%)
Seller Amount:   +$70.00 (70%)

PayPal Fees:     -$0.49 (approx, charged to platform)
Platform Net:    ~$29.51
```

**Note:** PayPal transaction fees (~0.49% + $0.30) are calculated and deducted during capture.

## 🛠️ NETLIFY FUNCTIONS SETUP

### Functions Created:

1. **`paypal-create-order.ts`**
   - Endpoint: `POST /.netlify/functions/paypal-create-order`
   - Creates a PayPal order (step 1 of payment flow)

2. **`paypal-capture-order.ts`**
   - Endpoint: `POST /.netlify/functions/paypal-capture-order`
   - Captures the payment and stores order in DB

3. **`paypal-payout.ts`**
   - Endpoint: `POST /.netlify/functions/paypal-payout`
   - Processes seller payouts (call periodically)

### Testing Functions Locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Test functions locally
netlify functions:serve

# Call a function
curl -X POST http://localhost:9000/.netlify/functions/paypal-create-order \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","productName":"Test","productPrice":10.00,"currency":"USD","buyerEmail":"test@example.com"}'
```

## 🔒 SECURITY BEST PRACTICES

### 1. **Never Expose Secrets**

- ❌ NEVER put `PAYPAL_CLIENT_SECRET` in frontend code
- ✅ Always use environment variables
- ✅ Backend only handles sensitive operations

### 2. **Validate All Inputs**

- Validate product prices on backend (don't trust frontend)
- Verify buyer and seller IDs exist in database
- Check product still exists and is available

### 3. **Idempotency**

- Use unique `sender_item_id` for payouts (prevents duplicate payments)
- Check order status before processing
- Handle webhook/retry scenarios

### 4. **Authentication & Authorization**

- Verify user is logged in before payment
- Ensure buyer ≠ seller
- Validate seller email before payout

### 5. **Transaction Logging**

- Log all payment attempts (success and failure)
- Store full PayPal responses for audit
- Enable Firestore audit logs

### 6. **Rate Limiting**

- Implement rate limiting on payment endpoints
- Prevent duplicate orders
- Throttle payout requests

### 7. **HTTPS Only**

- All payment endpoints must use HTTPS
- PayPal returns to HTTPS URLs only
- Use `SITE_URL` for production domain

## ⚠️ LIMITATIONS & IMPORTANT NOTES

### PayPal Limitations:

1. **Minimum Payout: $0.10**
   - Payouts below $0.10 USD cannot be processed
   - Accumulate small earnings before payout

2. **Payout Frequency**
   - Payouts take 1-5 business days
   - Some countries have restrictions
   - PayPal may hold funds for new sellers

3. **Account Requirements**
   - Seller must have PayPal account linked to email
   - Some countries/regions not supported
   - Age restrictions (18+ for business accounts)

4. **Currency Support**
   - PayPal supports ~100 currencies
   - Conversion fees apply for cross-currency
   - Recommend using single currency (USD)

5. **Transaction Limits**
   - New accounts have limits (~$10k/month initially)
   - Limits increase with account verification
   - Some payment methods have restrictions

### Implementation Notes:

1. **Split Payments**
   - Current implementation uses sequential payments
   - For higher volumes, consider PayPal Commerce Platform
   - PayPal Unified Payouts for batch processing

2. **Fees**
   - PayPal charges ~2.2% + $0.30 per transaction
   - You absorb this from platform fee
   - Consider price increases if margin too low

3. **Disputes & Chargebacks**
   - PayPal handles dispute resolution
   - You're protected with Seller Protection
   - Document transactions thoroughly

4. **Seller Verification**
   - Implement email verification for sellers
   - Request tax information if required
   - Store seller payment details securely

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Set all environment variables in Netlify
- [ ] Test functions with Netlify CLI locally
- [ ] Deploy to staging environment first
- [ ] Test with PayPal sandbox mode
- [ ] Verify Firestore rules for payment collections
- [ ] Set up monitoring/logging for payment failures
- [ ] Create admin dashboard for payouts
- [ ] Implement email notifications for buyers/sellers
- [ ] Set up automated payout schedule (cron job)
- [ ] Document refund process
- [ ] Brief team on payment procedures
- [ ] Switch to production when ready

## 📊 MONITORING & DEBUGGING

### Check PayPal Activity:

1. Go to PayPal Developer Dashboard
2. Sandbox or Live mode
3. View all transactions
4. Download reports

### Debug Failed Payments:

1. Check Netlify function logs
2. Verify Firestore documents exist
3. Confirm PayPal credentials are correct
4. Check payment order status in PayPal

### Common Errors:

- `"error": "Missing PayPal credentials"` → Set env vars
- `"error": "Failed to create PayPal order"` → Check credentials, amount
- `"error": "Failed to capture payment"` → Order may have expired (20 min limit)
- `"error": "Minimum payout amount is $0.10"` → Accumulate more earnings

## 📞 SUPPORT & RESOURCES

- **PayPal Developer Docs**: https://developer.paypal.com/docs/
- **PayPal Sandbox Testing**: https://www.sandbox.paypal.com
- **PayPal Support**: https://www.paypal.com/support
- **Netlify Functions Guide**: https://docs.netlify.com/functions/overview/

## 🔗 NEXT STEPS

1. Get PayPal credentials from Developer Dashboard
2. Set environment variables in Netlify
3. Deploy functions
4. Test with test user accounts
5. Implement admin dashboard for payout management
6. Set up automated payout cron job
7. Create seller onboarding flow
8. Add refund/dispute handling
9. Launch to production

---

**Last Updated**: 2024
**Status**: Production-Ready
