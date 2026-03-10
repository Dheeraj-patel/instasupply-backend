require('dotenv').config();
const { consumer } = require('../config/kafka');
const { createRedisClient } = require('../config/redis');
const db = require('../config/database');

class KafkaConsumerService {
  async start() {
    try {
      // Connect to Redis
      const redisClient = await createRedisClient();
      
      // Subscribe to topic
      await consumer.subscribe({ 
        topic: process.env.KAFKA_TOPIC, 
        fromBeginning: true 
      });
      
      console.log('Kafka consumer started, listening for messages...');
      
      // Process messages
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const eventData = JSON.parse(message.value.toString());
            console.log('Processing event:', {
              event: eventData.event,
              timestamp: eventData.timestamp,
              recordCount: eventData.records?.length || 0
            });
            
            // Update Redis cache with new data
            const allRecords = await db.query('SELECT * FROM records ORDER BY id');
            
            await redisClient.setEx(
              'all_records',
              parseInt(process.env.REDIS_TTL) || 3600,
              JSON.stringify(allRecords.rows)
            );
            
            console.log('Redis cache updated successfully');
            
          } catch (error) {
            console.error('Error processing message:', error);
            // Implement retry logic here if needed
          }
        }
      });
      
    } catch (error) {
      console.error('Consumer error:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => consumerService.shutdown());
process.on('SIGINT', () => consumerService.shutdown());

const consumerService = new KafkaConsumerService();
consumerService.start();