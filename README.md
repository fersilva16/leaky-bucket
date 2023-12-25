# Leaky bucket implementation using Redis sorted sets

A implementation of a [Leaky Bucket](https://en.wikipedia.org/wiki/Leaky_bucket) using [Redis sorted sets](https://redis.io/docs/data-types/sorted-sets). This solution designates Redis as the single source of truth, eliminating the need for server-side jobs or intervals, good for horizontal scaling and multiple instances.

## Example

```ts
const leaky = leakyBucket('leaky', {
  expiration: 2 * 60 * 1000, // 2 min
  resetExpiration: 20 * 60 * 1000, // 20 min
});

leaky.increment();
// ['1', '1703528891178'] - 2 min from now
// ttl 1200000 - 20 min

leaky.increment();
// ['1', '1703528891178', '2', '1703529011178'] - 2 min difference from last
// ttl 1200000 - 20 min (resets)

leaky.count();
// 2

leaky.decrement();
// ['1', '1703528891178']
```

## How to run

You will need to have `bun` installed and a `redis` instance running locally.

Install dependencies:

```bash
bun install
```

Run the start script

```bash
bun start
```

You can edit the `src/index.ts` and test the implmentation.

## How to run tests

Run the test script:

```bash
bun test
```
