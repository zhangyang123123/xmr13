import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { UPLOAD_DIR, PORT } from './config';
import { handleUpload } from './routes/upload';
import { serveFile } from './routes/files';
import { listFiles, deleteFile, getStats } from './routes/manage';
import { errorHandler } from './middleware/errorHandler';
import { uploadRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/logger';
import { getHomePage } from './pages/home';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.get('/', (_req, res) => {
  res.type('html').send(getHomePage());
});

app.post('/api/upload', uploadRateLimiter, handleUpload);

app.get('/files/:filename', serveFile);

app.get('/api/files', listFiles);
app.delete('/api/files/:filename', deleteFile);
app.get('/api/stats', getStats);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`File hosting service running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
});

export default app;
