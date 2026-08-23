import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import issuesRoutes from './routes/issues.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded issue photos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check - useful for Render/deployment platforms to verify the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CivicPulse API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`CivicPulse API running on port ${PORT}`);
});
