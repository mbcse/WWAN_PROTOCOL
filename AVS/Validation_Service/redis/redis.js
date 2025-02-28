const connections = require('../../Connections/connections.js')

module.exports = {
  pushMapToRedisWithKey: async function (key, object) {
    const redis = await connections.getRedisClient()
    await redis.hSet(key, object)
    console.log(`Pushed Map To Redis => ${key} -> ${JSON.stringify(object)}`)
    redis.quit()
  },
  pushStringToRedisWithKey: async function (key, value) {
    if (typeof value !== 'string') value = JSON.stringify(value)
    const redis = await connections.getRedisClient()
    await redis.set(key, value)
    console.log(`Pushed String To Redis => ${key} -> ${value}`)
    redis.quit()
  },
  pushStringToRedisWithKeyAndExpiry: async function (key, value, expiry) {
    if (typeof value !== 'string') value = JSON.stringify(value)
    const redis = await connections.getRedisClient()
    await redis.set(key, value, { EX: expiry })
    console.log(`Pushed String To Redis => ${key} -> ${value} with expiry of ${expiry} Seconds`)
    redis.quit()
  },
  getStringKey: async function (key) {
    const redis = await connections.getRedisClient()
    const value = await redis.get(key)
    redis.quit()
    return value
  }
}
