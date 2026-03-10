const db = require('../config/database');
const { getRedisClient } = require('../config/redis');

class FetchService {

  async getAllRecords() {

    const redisClient = getRedisClient();

    try {

      // 1️⃣ Try cache
      if (redisClient && redisClient.isReady) {

        const cachedData = await redisClient.get('all_records');

        if (cachedData) {
          console.log('Serving from cache');

          return {
            success: true,
            fromCache: true,
            data: JSON.parse(cachedData)
          };
        }
      }

    } catch (error) {
      console.error('Redis error:', error.message);
    }

    // 2️⃣ Fallback to database
    console.log('Serving from database');

    const result = await db.query('SELECT * FROM records ORDER BY id');

    const records = result.rows;

    // 3️⃣ Update cache
    try {

      if (redisClient && redisClient.isReady) {

        await redisClient.setEx(
          'all_records',
          parseInt(process.env.REDIS_TTL) || 3600,
          JSON.stringify(records)
        );    

        console.log('Cache updated');
      }

    } catch (error) {
      console.error('Cache set error:', error.message);
    }

    return {
      success: true,
      fromCache: false,
      data: records
    };
  }

  async clearCache() {

    const redisClient = getRedisClient();

    if (redisClient && redisClient.isReady) {
      await redisClient.del('all_records');
      console.log('Cache cleared manually');
      return true;
    }

    return false;
  }

}

module.exports = new FetchService();