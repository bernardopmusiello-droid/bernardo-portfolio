import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), draft: text('draft').notNull(), published: text('published'),
  version: integer('version').notNull().default(1), deletedAt: integer('deleted_at'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
});
export const media = sqliteTable('media', {
  id: text('id').primaryKey(), projectId: text('project_id').notNull().references(()=>projects.id),
  ownerId: text('owner_id').notNull(), filename: text('filename').notNull(),
  mime: text('mime').notNull(), size: integer('size').notNull(), objectKey: text('object_key').notNull(),
  status: text('status').notNull().default('uploading'), uploadId: text('upload_id').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, t=>[index('idx_media_project').on(t.projectId)]);
export const uploadParts = sqliteTable('upload_parts', {
  mediaId: text('media_id').notNull().references(()=>media.id,{onDelete:'cascade'}),
  part: integer('part').notNull(), checksum: text('checksum').notNull().default(''), etag: text('etag').notNull(), size: integer('size').notNull(),
}, t=>[primaryKey({columns:[t.mediaId,t.part]})]);
export const audit = sqliteTable('audit', {
  id: integer('id').primaryKey({autoIncrement:true}), action: text('action').notNull(),
  projectId: text('project_id'), createdAt: integer('created_at').notNull(),
});
