const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');

jest.mock('../src/config/kafka', () => ({
  connectProducer: jest.fn(),
  producer: {
    send: jest.fn().mockResolvedValue({})
  }
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
    expect(response.body.data.recordsProcessed).toBe(1);
  });

  it('should reject non-CSV files', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('test'), 'test.txt');
    
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should handle duplicate emails gracefully', async () => {
    const csvContent = 'name,email,phone,address\nJohn Doe,john@example.com,1234567890,123 Main St';
    
    // First upload
    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(csvContent), 'test.csv');
    
    // Second upload with same email
    const response = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(csvContent), 'test.csv');
    
    expect(response.status).toBe(200);
    expect(response.body.data.recordsProcessed).toBe(1);
  });
});