import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'pgmate_jwt_secret_dev_key_2026_super_secure_auth',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  payment: {
    provider: process.env.PAYMENT_PROVIDER || 'sandbox',
    hyperswitchApiKey: process.env.HYPERSWITCH_API_KEY || '',
    hyperswitchMerchantId: process.env.HYPERSWITCH_MERCHANT_ID || 'pgmate_merchant',
    hyperswitchBaseUrl: process.env.HYPERSWITCH_BASE_URL || 'https://sandbox.hyperswitch.io',
    webhookSecret: process.env.HYPERSWITCH_WEBHOOK_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || '',
  }
};
