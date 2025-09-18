import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  s3Url: varchar('s3_url', { length: 1000 }).notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  width: integer('width'),
  height: integer('height'),
  fileSize: integer('file_size'),
  contentHash: varchar('content_hash', { length: 64 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  // Unsplash fields (for Phase 3)
  unsplashId: varchar('unsplash_id', { length: 50 }),
  unsplashUserId: varchar('unsplash_user_id', { length: 50 }),
  unsplashLikes: integer('unsplash_likes').default(0),
}, (table) => ({
  contentHashIdx: uniqueIndex('content_hash_idx').on(table.contentHash),
}));

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  images: many(images),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  category: one(categories, {
    fields: [images.categoryId],
    references: [categories.id],
  }),
}));

// Types
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;