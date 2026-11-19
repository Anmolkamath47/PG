import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    // If Cloudinary credentials are set in production, upload to cloud
    let fileUrl = `/uploads/${req.file.filename}`;
    const cloudUrl = await uploadToCloudinary(req.file.path, 'pgmate/complaints');
    if (cloudUrl) {
      fileUrl = cloudUrl;
    }

    res.status(200).json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      storage: cloudUrl ? 'cloudinary' : 'local',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'File upload processing failed', error: error.message });
  }
});

export default router;
