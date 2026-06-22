import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const workboardTokens = pgTable(
  "workboard_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().unique(),
    encryptedToken: text("encrypted_token").notNull(),
    tokenHash: text("token_hash").notNull(),
    workboardBaseUrl: text("workboard_base_url").notNull(),
    workboardV2BaseUrl: text("workboard_v2_base_url").notNull(),
    lastVerifiedAt: timestamp("last_verified_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("workboard_tokens_user_id_idx").on(table.userId),
    index("workboard_tokens_token_hash_idx").on(table.tokenHash),
  ],
);

export type WorkboardTokenRow = typeof workboardTokens.$inferSelect;
