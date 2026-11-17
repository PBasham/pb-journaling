import { beforeAll } from '@jest/globals';
import initSqlJs from 'sql.js';

beforeAll(async () => {
  globalThis.__SQL__ ??= await initSqlJs();
});
