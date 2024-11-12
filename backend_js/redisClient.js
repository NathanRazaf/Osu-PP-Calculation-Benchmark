// redisClient.js
const redis = require('redis');

const client = redis.createClient();

async function connectRedis() {
    if (!client.isOpen) {
        await client.connect();
        console.log('Redis client connected');
    }
}

async function disconnectRedis() {
    if (client.isOpen) {
        await client.quit();
        console.log('Redis client disconnected');
    }
}

module.exports = { client, connectRedis, disconnectRedis };
