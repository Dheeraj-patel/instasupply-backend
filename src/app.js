const express = require('express');
const dotenv = require('dotenv');
const uploadController = require('./controllers/uploadController');
const fetchController = require('./controllers/fetchController');
const { connectProducer } = require('./config/kafka');
const { createRedisClient } = require('./config/redis');
const db = require('./config/database');

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.post('/api/upload', 
  uploadController.getUploadMiddleware(), 
  uploadController.uploadCSV.bind(uploadController)
);

app.get('/api/records', fetchController.getAllRecords.bind(fetchController));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.delete('/api/cache', fetchController.clearCache.bind(fetchController));
const startServer = async () => {
  try {
    // Connect to Kafka producer
    await connectProducer();
    
    // Connect to Redis
    await createRedisClient();
    
    // Test database connection
    await db.query('SELECT 1');
    console.log('Database connected');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;