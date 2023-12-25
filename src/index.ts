import { leakyBucket } from './leakyBucket';
import { redis } from './redis';

(async () => {
  const leaky = leakyBucket('leaky', {
    expiration: 2 * 60 * 1000, // 2 min
    resetExpiration: 20 * 60 * 1000, // 20 min
  });

  console.log(await redis.ttl('leaky'));

  console.log(await leaky.increment());

  console.log(await leaky.debug());

  console.log(await leaky.decrement());

  console.log(await leaky.count());

  console.log(await redis.ttl('leaky'));

  process.exit(0);
})();
