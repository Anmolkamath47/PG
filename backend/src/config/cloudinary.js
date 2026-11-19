import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

const isCloudinaryConfigured = Boolean(
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  console.log('Cloudinary initialized for cloud media uploads');
}

export const uploadToCloudinary = async (filePath, folder = 'pgmate') => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.warn('Cloudinary upload warning:', error.message);
    return null;
  }
};

export { cloudinary, isCloudinaryConfigured };
