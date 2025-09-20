import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),    // Optimized Unsplash URL
  originalUrl: text('original_url').notNull(), // Original Unsplash URL
  categoryId: integer('category_id').references(() => categories.id),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  fileSize: integer('file_size'),
  unsplashId: text('unsplash_id').notNull().unique(),
  unsplashUserId: text('unsplash_user_id'),
  unsplashUserName: text('unsplash_user_name'),
  unsplashLikes: integer('unsplash_likes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Types for TypeScript
export type Category = typeof categories.$inferSelect;
export type Image = typeof images.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type NewImage = typeof images.$inferInsert;