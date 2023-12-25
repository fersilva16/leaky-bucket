import { it, expect, beforeEach, beforeAll } from 'bun:test';
import Mockdate from 'mockdate';

import { leakyBucket } from '../leakyBucket';
import { redis } from '../redis';

beforeEach(async () => {
  await redis.flushall();
});

beforeEach(() => {
  Mockdate.reset();
});

const key = 'leaky';
const expiration = 2 * 60 * 1000; // 2 min
const resetExpiration = 20 * 60 * 1000; // 20 min;

it('should increment', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await leaky.increment();

  expect(result).toBe(1);

  expect(await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')).toEqual([
    '1',
    '1703462520000',
  ]);

  expect(await redis.ttl(key)).toBe(1200000);
});

it('should increment and remove expired tokens', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  await redis.zadd(key, '1703462399999', '1');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await leaky.increment();

  expect(result).toBe(1);

  expect(await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')).toEqual([
    '1',
    '1703462520000',
  ]);
});

it('should increment using last token and reset expiration', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  await redis.zadd(key, '1703462520000', '1');
  await redis.expire(key, 400);

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await leaky.increment();

  expect(result).toBe(2);

  expect(await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')).toEqual([
    '1',
    '1703462520000',
    '2',
    '1703462760000',
  ]);

  expect(await redis.ttl(key)).toBe(1200000);
});

it('should increment without duplicating tokens', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await Promise.all([
    leaky.increment(),
    leaky.increment(),
    leaky.increment(),
    leaky.increment(),
  ]);

  expect(result).toEqual([1, 2, 3, 4]);

  expect(await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')).toEqual([
    '1',
    '1703462520000',
    '2',
    '1703462760000',
    '3',
    '1703463120000',
    '4',
    '1703463600000',
  ]);

  expect(await redis.ttl(key)).toBe(1200000);
});

it('should decrement', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  await redis.zadd(key, '1703462400000', '1');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  await leaky.decrement();

  expect(await redis.zrangebyscore(key, '-inf', '+inf', 'WITHSCORES')).toEqual(
    []
  );
});

it('should count the tokens', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  await redis.zadd(key, '1703462520000', '1');
  await redis.zadd(key, '1703462640000', '2');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await leaky.count();

  expect(result).toBe(2);
});

it('should count the tokens without expired ones', async () => {
  Mockdate.set('2023-12-25T00:00:00.000Z');

  await redis.zadd(key, '1703462399999', '1');
  await redis.zadd(key, '1703462519999', '2');

  const leaky = leakyBucket(key, {
    expiration,
    resetExpiration,
  });

  const result = await leaky.count();

  expect(result).toBe(1);
});
