import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventory';
import { Database } from './database/connection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/inventory', inventoryRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log(`  POST   /api/inventory/receipts - Create receipt`);
  console.log(`  GET    /api/inventory/receipts - List receipts`);
  console.log(`  GET    /api/inventory/receipts/:id - Get receipt details`);
  console.log(`  GET    /api/inventory/receipts/:id/items - Get receipt items`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await Database.close();
  process.exit(0);
});
