import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

export const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis error', err));
await redisClient.connect();

export const redisPubClient = redisClient.duplicate();
export const redisSubClient = redisClient.duplicate();
await redisPubClient.connect();
await redisSubClient.connect();