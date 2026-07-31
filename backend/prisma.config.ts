/// <reference types="node" />
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

config({ path: resolve(__dirname, '../.env') });

export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL as string,
  },
});
