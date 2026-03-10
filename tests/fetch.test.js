const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { getRedisClient } = require('../src/config/redis');

describe('Fetch API', () => {
  beforeEach(async () => {
    await db.query('DELETE FROM records');
    const redis = getRedisClient();
    if (redis) await redis.del('all_records');
  });

  afterAll(async () => {
    await db.pool.end();
  });

  it('should fetch records from database when cache is empty', async () => {
    // Insert test data
    await db.query(
      'INSERT INTO records (name, email, phone, address) VALUES ($1, $2, $3, $4)',
      ['John Doe', 'john@example.com', '1234567890', '123 Main St']
    );
    
    const response = await request(app).get('/api/records');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.fromCache).toBe(false);
    expect(response.body.count).toBe(1);
  });
});