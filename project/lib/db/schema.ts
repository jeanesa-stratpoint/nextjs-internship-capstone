import { relations } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, uuid, primaryKey, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed', 'on-hold']);
export const listStageEnum = pgEnum("list_stage", ["unstarted", "in_progress", "completed"]);
export const eventTypeEnum = pgEnum('event_type', ['meeting', 'milestone', 'reminder']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'declined', 'revoked', 'expired']);

// RBAC
export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'Project Manager', 'Developer'
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: text('action').notNull().unique(), // e.g., 'create:project', 'delete:task'
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));



export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date'),
  status: projectStatusEnum("status").default("active").notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectMembers = pgTable('project_members', {
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').notNull(), 
  role: text('role').notNull().default('member'), // Can be 'owner', 'admin', or 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [
  // user can only be added to a specific project once
  primaryKey({ columns: [t.projectId, t.userId] }), 
]);

// KANBAN
export const lists = pgTable('lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  color: text('color').default('#6B7280'),
  stage: listStageEnum("stage").default("in_progress").notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  contentHtml: text('content_html'), 
  attachmentUrl: text('attachment_url'),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  priority: priorityEnum('priority').default('medium'),
  dueDate: timestamp('due_date'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskActivities = pgTable("task_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  actionType: varchar("action_type", { length: 50 }).notNull(), // e.g., 'created', 'assigned', 'moved', 'updated'
  oldValue: text("old_value"), 
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  content: text("content").notNull(),

  isEdited: boolean("is_edited").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: eventTypeEnum('type').default('meeting').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  creatorId: text('creator_id')
    .references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projectInvitations = pgTable('project_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  status: invitationStatusEnum('status').default('pending').notNull(),
  invitedBy: text('invited_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id],
  }),
  inviter: one(users, {
    fields: [projectInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks),
  activities: many(taskActivities),
  comments: many(comments),
  createdEvents: many(events),
  invitations: many(projectInvitations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  lists: many(lists),
  events: many(events),
  invitations: many(projectInvitations),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  project: one(projects, {
    fields: [lists.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  activities: many(taskActivities),
  comments: many(comments),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const taskActivitiesRelations = relations(taskActivities, ({ one }) => ({
  task: one(tasks, {
    fields: [taskActivities.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskActivities.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
}));