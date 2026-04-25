import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const levelEnum = pgEnum("level", ["L1", "L2", "L3"]);
export const postingStatusEnum = pgEnum("posting_status", [
  "Past",
  "Current",
  "Planned",
  "Candidate",
]);

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  level: levelEnum("level").notNull(),
  parentUnitId: integer("parent_unit_id"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Roles can be internal (unitId set, isExternal=false) or external
// (unitId null, isExternal=true, externalUnit holds the sub-unit text
// e.g. "DPLD", "X AELG", "APD").
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  unitId: integer("unit_id").references(() => units.id),
  level: levelEnum("level").notNull(),
  isHead: boolean("is_head").notNull().default(false),
  isExternal: boolean("is_external").notNull().default(false),
  externalUnit: text("external_unit"),
  standardTenureMonths: integer("standard_tenure_months"),
  isVacant: boolean("is_vacant").notNull().default(false),
  specialisation: text("specialisation"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Individuals can be internal or external (e.g. "COL James Lim coming
// in to Branch Head A from outside RAiD").
export const individuals = pgTable("individuals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  employeeId: text("employee_id"),
  rank: text("rank"),
  specialisation: text("specialisation"),
  email: text("email"),
  isExternal: boolean("is_external").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const postings = pgTable("postings", {
  id: serial("id").primaryKey(),
  individualId: integer("individual_id")
    .notNull()
    .references(() => individuals.id),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id),
  status: postingStatusEnum("status").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const unitsRelations = relations(units, ({ one, many }) => ({
  parent: one(units, {
    fields: [units.parentUnitId],
    references: [units.id],
    relationName: "unit_parent",
  }),
  children: many(units, { relationName: "unit_parent" }),
  roles: many(roles),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  unit: one(units, { fields: [roles.unitId], references: [units.id] }),
  postings: many(postings),
}));

export const individualsRelations = relations(individuals, ({ many }) => ({
  postings: many(postings),
}));

export const postingsRelations = relations(postings, ({ one }) => ({
  individual: one(individuals, {
    fields: [postings.individualId],
    references: [individuals.id],
  }),
  role: one(roles, { fields: [postings.roleId], references: [roles.id] }),
}));

export type Unit = typeof units.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Individual = typeof individuals.$inferSelect;
export type Posting = typeof postings.$inferSelect;
export type PostingStatus = (typeof postingStatusEnum.enumValues)[number];
export type Level = (typeof levelEnum.enumValues)[number];
