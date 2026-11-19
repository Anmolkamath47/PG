import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';

export const cleanDummyAvatars = async () => {
  try {
    await connectDB();
    console.log('🔍 Checking users for dummy Unsplash avatars...');
    const result = await User.updateMany(
      { avatar: { $regex: 'unsplash', $options: 'i' } },
      { $set: { avatar: '' } }
    );
    console.log(`✅ Cleared dummy avatars on ${result.modifiedCount} users.`);
    await closeDB();
  } catch (err) {
    console.error('Error cleaning dummy avatars:', err);
    process.exit(1);
  }
};

cleanDummyAvatars();
