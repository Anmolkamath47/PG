import crypto from 'crypto';

/**
 * Hyperswitch Payment Orchestrator Adapter
 * Reference: https://docs.hyperswitch.io/
 */
export class HyperswitchAdapter {
  constructor({ apiKey, merchantId, baseUrl, webhookSecret }) {
    this.apiKey = apiKey;
    this.merchantId = merchantId;
    this.baseUrl = baseUrl || 'https://sandbox.hyperswitch.io';
    this.webhookSecret = webhookSecret;
    this.name = 'hyperswitch';
  }

  // Create payment session / intent for tenant rent invoice
  async createPaymentSession({
    amount, // In INR rupees
    currency = 'INR',
    orderId,
    customerId,
    customerEmail,
    customerPhone,
    customerName,
    metadata = {},
  }) {
    const amountInSubunits = Math.round(amount * 100); // Hyperswitch takes amounts in subunits (paise for INR)

    const payload = {
      amount: amountInSubunits,
      currency: currency.toUpperCase(),
      customer_id: String(customerId),
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      description: `PGmate Rent Payment for Invoice ${orderId}`,
      order_id: String(orderId),
      capture_method: 'automatic',
      authentication_type: 'three_ds',
      metadata: {
        ...metadata,
        platform: 'PGmate',
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Hyperswitch payment creation failed');
      }

      return {
        success: true,
        provider: 'hyperswitch',
        paymentId: data.payment_id,
        clientSecret: data.client_secret,
        status: data.status,
        amount: amount,
        currency,
        publishableKey: this.apiKey,
      };
    } catch (error) {
      console.error('Hyperswitch API error:', error.message);
      throw error;
    }
  }

  // Verify webhook signature sent by Hyperswitch
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!this.webhookSecret || !signatureHeader) return false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch (err) {
      return false;
    }
  }

  // Confirm / fetch payment status from Hyperswitch
  async getPaymentStatus(paymentId) {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      headers: {
        'api-key': this.apiKey,
      },
    });
    const data = await response.json();
    return {
      status: data.status, // 'succeeded', 'failed', 'processing'
      paymentId: data.payment_id,
      amount: (data.amount || 0) / 100,
      currency: data.currency,
      paymentMethod: data.payment_method,
    };
  }
}
