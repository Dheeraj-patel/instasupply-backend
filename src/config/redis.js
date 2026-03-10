const Redis = require('redis');
require('dotenv').config();

let redisClient = null;

const createRedisClient = async () => {
  if (redisClient) return redisClient;
  
  redisClient = Redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  
  await redisClient.connect();
  return redisClient;
};

const getRedisClient = () => redisClient;

module.exports = { createRedisClient, getRedisClient };