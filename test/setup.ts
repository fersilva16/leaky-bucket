import { mock } from 'bun:test';

// Hack because of https://github.com/oven-sh/bun/issues/4694
mock.module('readline-sync', () => ({ setDefaultOptions: () => {} }));

mock.module('ioredis', () => {
  const Redis = require('ioredis-mock');

  return { Redis };
});
