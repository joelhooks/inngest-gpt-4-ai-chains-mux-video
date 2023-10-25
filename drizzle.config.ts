import { type Config } from "drizzle-kit";
import { env } from "@/env.mjs";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  tablesFilter: ["inngest-gpt-4-ai-chains-mux-video_*"],
} satisfies Config;
