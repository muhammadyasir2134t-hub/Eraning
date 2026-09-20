import { defineConfig } from "drizzle-kit";

const host = process.env.SQL_HOST;
const user = process.env.SQL_USER;
const password = process.env.SQL_PASSWORD;
const database = process.env.SQL_DB_NAME;

const connectionString = process.env.DATABASE_URL || (host && user && database
  ? (host.startsWith('/')
      ? `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password || '')}@localhost/${database}?host=${encodeURIComponent(host)}`
      : `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password || '')}@${host}:5432/${database}`)
  : "");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

