import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 每个用户每分钟最多 20 次请求
export const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  analytics: true,
});
