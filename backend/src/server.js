import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
import { seedDatabase } from './scripts/seed.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed database if empty to provide immediate rich realistic PG experience
    await seedDatabase(false);

    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 PGmate Backend running on http://localhost:${PORT}`);
      console.log(`🛡️ Environment: ${config.nodeEnv}`);
      console.log(`💳 Payment Adapter: ${config.payment.provider}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
