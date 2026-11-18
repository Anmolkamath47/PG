import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Isolated Sandbox Payment Adapter
 * Designed for safe local development & testing Indian payment flows (UPI, Cards, NetBanking).
 * Explicitly designated as SANDBOX to ensure mock payments are never misrepresented as real funds.
 */
export class MockSandboxAdapter {
  constructor({ merchantId, webhookSecret }) {
    this.merchantId = merchantId || 'pgmate_sandbox_merchant';
    this.webhookSecret = webhookSecret || 'sandbox_secret_2026';
    this.name = 'sandbox';
  }

  // Create sandbox payment order
  async createPaymentSession({
    amount,
    currency = 'INR',
    orderId,
    customerId,
    customerEmail,
    customerPhone,
    customerName,
    metadata = {},
  }) {
    const paymentId = `sandbox_pay_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const clientSecret = `sandbox_sec_${uuidv4()}`;

    return {
      success: true,
      provider: 'sandbox',
      isSandbox: true,
      modeDescription: 'PGmate Sandbox Payment Environment (Test Mode)',
      paymentId,
      clientSecret,
      status: 'requires_payment_method',
      amount,
      currency,
      supportedMethods: [
        {
          type: 'upi',
          name: 'UPI (Google Pay, PhonePe, Paytm, BHIM)',
          description: 'Instant UPI Intent or Virtual Payment Address (VPA)',
          testVpa: 'tenant@okhdfcbank'
        },
        {
          type: 'card',
          name: 'Credit / Debit Card (RuPay, Visa, Mastercard)',
          description: 'Supports domestic Indian cards',
        },
        {
          type: 'netbanking',
          name: 'Net Banking',
          banks: ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'],
        }
      ],
      metadata: {
        orderId,
        customerId,
        ...metadata,
      }
    };
  }

  // Simulate payment completion in sandbox with server verification
  async processSandboxPayment({
    paymentId,
    amount,
    paymentMethod,
    methodDetails = {}, // e.g., { vpa: 'rahul@okhdfcbank' } - sensitive PINs are never stored or accepted
  }) {
    // Fail if test triggers failure
    if (methodDetails.vpa === 'fail@upi' || methodDetails.simulateFailure) {
      return {
        success: false,
        status: 'failed',
        transactionId: `TXN_FAIL_${Date.now()}`,
        failureReason: 'Payment declined by issuing bank (Sandbox simulation)',
      };
    }

    const transactionId = `TXN_SANDBOX_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      status: 'success',
      isSandbox: true,
      transactionId,
      paymentId,
      amount,
      currency: 'INR',
      paymentMethod: `sandbox_${paymentMethod || 'upi'}`,
      providerReference: `REF_${uuidv4().slice(0, 12).toUpperCase()}`,
      timestamp: new Date(),
    };
  }

  // Verify HMAC signature for sandbox webhooks
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return true; // lenient in dev test mode
    try {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
        .digest('hex');
      return signatureHeader === expected || signatureHeader === 'sandbox_valid_sig';
    } catch (e) {
      return false;
    }
  }

  async getPaymentStatus(paymentId) {
    return {
      status: 'success',
      paymentId,
      isSandbox: true,
    };
  }
}
