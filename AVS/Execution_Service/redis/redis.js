const redis = require('redis');

const REDIS_PORT = process.env.REDIS_PORT || 12408;
const REDIS_HOST = process.env.REDIS_HOST || 'redis-12408.c266.us-east-1-3.ec2.redns.redis-cloud.com';
module.exports = {
  getRedisClient: async () => {
    try {
      const client = redis.createClient({ 
        username: 'default',
        password: 'X9ruMny1CMGFvRpB3S4RPJXdzDwEEprq',
        socket: {
            host: 'redis-12408.c266.us-east-1-3.ec2.redns.redis-cloud.com',
            port: 12408
        },
        retry_strategy: function(options) {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Add error handling
      client.on('error', (err) => console.error('Redis Client Error', err));
      client.on('connect', () => console.log('Redis Client Connected'));

      await client.connect();
      return client;
    } catch (err) {
      console.error('Cannot Connect to Redis:', err);
      throw err;
    }
  },

  pushMapToRedisWithKey: async function (key, object) {
    let client;
    try {
      client = await this.getRedisClient(); // Use this to call the method
      await client.hSet(key, object);
      console.log(`Pushed Map To Redis => ${key} -> ${JSON.stringify(object)}`);
    } catch (err) {
      console.error('Error pushing map to Redis:', err);
      throw err;
    } finally {
      if (client) await client.quit();
    }
  },

  pushStringToRedisWithKey: async function (key, value) {
    let client;
    try {
      if (typeof value !== 'string') value = JSON.stringify(value);
      client = await this.getRedisClient(); // Use this to call the method
      await client.set(key, value);
      console.log(`Pushed String To Redis => ${key} -> ${value}`);
    } catch (err) {
      console.error('Error pushing string to Redis:', err);
      throw err;
    } finally {
      if (client) await client.quit();
    }
  },

  pushStringToRedisWithKeyAndExpiry: async function (key, value, expiry) {
    let client;
    try {
      if (typeof value !== 'string') value = JSON.stringify(value);
      client = await this.getRedisClient(); // Use this to call the method
      await client.set(key, value, { EX: expiry });
      console.log(`Pushed String To Redis => ${key} -> ${value} with expiry of ${expiry} Seconds`);
    } catch (err) {
      console.error('Error pushing string with expiry to Redis:', err);
      throw err;
    } finally {
      if (client) await client.quit();
    }
  },

  getStringKey: async function (key) {
    let client;
    try {
      client = await this.getRedisClient(); // Use this to call the method
      const value = await client.get(key);
      return value;
    } catch (err) {
      console.error('Error getting string from Redis:', err);
      throw err;
    } finally {
      if (client) await client.quit();
    }
  }
};
