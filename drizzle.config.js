/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./utils/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_gun6mAhrP4Gk@ep-yellow-mud-a5yr0cu5-pooler.us-east-2.aws.neon.tech/ai-interview-mocker?sslmode=require",
  },
};
