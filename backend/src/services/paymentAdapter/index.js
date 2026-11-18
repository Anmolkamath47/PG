import { HyperswitchAdapter } from './hyperswitchAdapter.js';
import { MockSandboxAdapter } from './mockSandboxAdapter.js';
import { config } from '../../config/env.js';

class PaymentGatewayFactory {
  static getAdapter(provider = config.payment.provider) {
    if (provider === 'hyperswitch') {
      return new HyperswitchAdapter({
        apiKey: config.payment.hyperswitchApiKey,
        merchantId: config.payment.hyperswitchMerchantId,
        baseUrl: config.payment.hyperswitchBaseUrl,
        webhookSecret: config.payment.webhookSecret,
      });
    }

    // Default to isolated Sandbox Provider Adapter for local development & testing
    return new MockSandboxAdapter({
      merchantId: config.payment.hyperswitchMerchantId,
      webhookSecret: config.payment.webhookSecret || 'sandbox_webhook_secret_key',
    });
  }
}

export const paymentAdapter = PaymentGatewayFactory.getAdapter();
export { HyperswitchAdapter, MockSandboxAdapter };
