require("dotenv/config")

const { defineConfig } = require("prisma/config")

module.exports = defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",

    seed: "node prisma/seed.mjs",
  },

  datasource: {
    url:
      process.env["DIRECT_URL"] ??
      process.env["DATABASE_URL"] ??
      "postgresql://postgres:@localhost:5432/kunjungan_tracker?schema=public",
  },
})
