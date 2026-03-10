const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { getRedisClient } = require('../src/config/redis');

// Mock Redis
jest.mock('../src/config/redis', () => ({
  getRedisClient: jest.fn(),
  createRedisClient: jest.fn()
}));

// Mock Kafka
jest.mock('../src/config/kafka', () => ({
  producer: {
    send: jest.fn()
  },
  connectProducer: jest.fn()
}));

describe('Fetch API', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM records');
  });

  afterAll(async () => {
    await db.pool.end();
  });

  it('should fetch records from database when cache is empty', async () => {
    // Mock Redis to return null (cache miss)
    const mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn(),
      isReady: true
    };
    getRedisClient.mockReturnValue(mockRedis);

    // Insert test data
    await db.query(
      'INSERT INTO records (name, email, phone, address) VALUES ($1, $2, $3, $4)',
      ['John Doe', 'john@example.com', '1234567890', '123 Main St']
    );
    
    const response = await request(app).get('/api/records');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
  });

  it('should fetch records from cache when available', async () => {
    // Mock Redis to return cached data
    const mockData = [{ id: 1, name: 'Cached User' }];
    const mockRedis = {
      get: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      setEx: jest.fn(),
      isReady: true
    };
    getRedisClient.mockReturnValue(mockRedis);
    
    const response = await request(app).get('/api/records');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});