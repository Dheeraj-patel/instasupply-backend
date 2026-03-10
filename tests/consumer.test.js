const { consumer } = require('../src/config/kafka');
const db = require('../src/config/database');
const { getRedisClient } = require('../src/config/redis');

jest.mock('../src/config/kafka', () => ({
  consumer: {
    connect: jest.fn(),
    subscribe: jest.fn(),
    run: jest.fn(),
    disconnect: jest.fn()
  }
}));

describe('Kafka Consumer', () => {
  it('should update Redis cache when message received', async () => {
    const mockMessage = {
      topic: 'csv-uploads',
      partition: 0,
      message: {
        value: Buffer.from(JSON.stringify({
          event: 'UPLOAD_COMPLETED',
          timestamp: new Date().toISOString(),
          records: [{ id: 1, name: 'John Doe' }]
        }))
      }
    };
    
    // Mock the consumer run callback
    const runCallback = consumer.run.mock.calls[0][0];
    await runCallback.eachMessage(mockMessage);
    
    const redis = getRedisClient();
    const cachedData = await redis.get('all_records');
    
    expect(cachedData).toBeTruthy();
  });
});