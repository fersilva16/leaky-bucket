import { redis } from './redis';

type LeakyBucketOptions = {
  expiration: number;
  resetExpiration: number;
};

export const leakyBucket = (
  key: string,
  { expiration, resetExpiration }: LeakyBucketOptions
) => {
  const increment = async () => {
    const now = Date.now();

    await redis.zremrangebyscore(key, 0, now);

    const range = await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES');

    const last = Number(range.at(-2)) || 0;
    const lastEx = Number(range.at(-1)) || now;
    const lastCount = range.length / 2;
    const count = lastCount + 1;

    const result = await redis.zadd(
      key,
      now + (lastEx - now) + expiration * count,
      last + 1
    );

    await redis.expire(key, resetExpiration);

    if (!result) {
      return await increment();
    }

    return count;
  };

  const decrement = async () => {
    await redis.zremrangebyrank(key, -1, -1);
  };

  const count = async () => {
    return await redis.zcount(key, Date.now(), '+inf');
  };

  const debug = async () => {
    return await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES');
  };

  return {
    increment,
    decrement,
    count,
    debug,
  };
};
