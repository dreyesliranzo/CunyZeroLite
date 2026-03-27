import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: 'file:./prisma/dev.db',
  },
  migrations: {
    // This tells Prisma 7 how to execute your seed file
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
});