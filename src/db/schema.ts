import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const termEnum = pgEnum("term", ["1", "2", "summer"]);

export const courseMediumEnum = pgEnum("course_medium", ["in_person", "hybrid", "online"]);

export const assessmentTypeEnum = pgEnum("assessment_type", ["exam", "project", "both"]);

export const wouldRecommendEnum = pgEnum("would_recommend", ["yes", "no", "maybe"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("profiles_username_lower_idx").on(t.username)],
);

export const professors = pgTable(
  "professors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("professors_name_idx").on(t.name)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    subject: text("subject").notNull(),
    number: text("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    credits: text("credits"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("courses_code_idx").on(t.code),
    index("courses_subject_idx").on(t.subject),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    professorId: uuid("professor_id").references(() => professors.id, {
      onDelete: "set null",
    }),
    term: termEnum("term").notNull(),
    year: integer("year").notNull(),
    grade: text("grade"),
    overallRating: smallint("overall_rating").notNull(),
    difficulty: smallint("difficulty").notNull(),
    enjoyability: smallint("enjoyability"),
    usefulness: smallint("usefulness"),
    medium: courseMediumEnum("medium"),
    assessmentType: assessmentTypeEnum("assessment_type"),
    workloadHours: smallint("workload_hours"),
    wouldRecommend: wouldRecommendEnum("would_recommend"),
    groupwork: boolean("groupwork"),
    body: text("body").notNull(),
    syllabusPath: text("syllabus_path"),
    syllabusUrl: text("syllabus_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("reviews_course_idx").on(t.courseId),
    index("reviews_user_idx").on(t.userId),
    index("reviews_created_at_idx").on(t.createdAt),
  ],
);

export const reviewFiles = pgTable(
  "review_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    url: text("url").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("review_files_review_idx").on(t.reviewId)],
);

export const profilesRelations = relations(profiles, ({ many }) => ({
  reviews: many(reviews),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  author: one(profiles, { fields: [reviews.userId], references: [profiles.id] }),
  course: one(courses, { fields: [reviews.courseId], references: [courses.id] }),
  professor: one(professors, {
    fields: [reviews.professorId],
    references: [professors.id],
  }),
  files: many(reviewFiles),
}));

export const reviewFilesRelations = relations(reviewFiles, ({ one }) => ({
  review: one(reviews, { fields: [reviewFiles.reviewId], references: [reviews.id] }),
}));

export const professorsRelations = relations(professors, ({ many }) => ({
  reviews: many(reviews),
}));

export type Profile = typeof profiles.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Professor = typeof professors.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type ReviewFile = typeof reviewFiles.$inferSelect;
export type NewReviewFile = typeof reviewFiles.$inferInsert;
