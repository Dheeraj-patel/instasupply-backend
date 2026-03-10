const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

// Mock Kafka
jest.mock('../src/config/kafka', () => ({
  producer: {
    send: jest.fn().mockResolvedValue({})
  },
  connectProducer: jest.fn()
}));

describe('Upload API', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM records');
  });

  afterAll(async () => {
    await db.pool.end();
  });

  it('should upload CSV file successfully', async () => {
    const csvContent = 'name,email,phone,address\nJohn Doe,john@example.com,1234567890,123 Main St';
    
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(csvContent), 'test.csv');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject non-CSV files', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.txt');
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});