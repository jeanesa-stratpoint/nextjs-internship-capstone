import { db } from "@/lib/db";
import { projects, projectMembers, lists, tasks, comments, taskActivities, users } from "@/lib/db/schema";
import { eq, desc, inArray, asc } from "drizzle-orm";

export const queries = {
  // PROJECT QUERIES
  projects: {
    // Get all projects for the dashboard
    getAllForUser: async (userId: string) => {
      return await db
        .select({ project: projects, role: projectMembers.role })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, userId))
        .orderBy(desc(projects.createdAt));
    },
    
    // Get details for a specific project
    getById: async (id: string) => {
      const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return result[0] || null;
    },

    // Get team members for a specific project
    getMembers: async (projectId: string) => {
      return await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));
    },

    // Used for the Dashboard grid to count members across multiple projects
    getMembersForMultiple: async (projectIds: string[]) => {
      if (projectIds.length === 0) return [];
      return await db.select().from(projectMembers).where(inArray(projectMembers.projectId, projectIds));
    }
  },

  // KANBAN & TASK QUERIES
  tasks: {
    // Get all columns (lists) for a project board
    getListsByProject: async (projectId: string) => {
      return await db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.order));
    },

    // Get all tasks inside specific columns
    getByListIds: async (listIds: string[]) => {
      if (listIds.length === 0) return [];
      return await db.select().from(tasks).where(inArray(tasks.listId, listIds)).orderBy(asc(tasks.order));
    },

    // Get a specific task for the Edit Modal
    getById: async (taskId: string) => {
      const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      return result[0] || null;
    },

    getListById: async (id: string) => {
      const result = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
      return result[0] || null;
    },

    // Get the comment feed for a task
    getComments: async (taskId: string) => {
      return await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          isEdited: comments.isEdited,
          user: { id: users.id, firstName: users.firstName, lastName: users.lastName }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.taskId, taskId))
        .orderBy(desc(comments.createdAt));
    },

    // Get the audit log feed for a task
    getActivities: async (taskId: string) => {
      return await db
        .select({
          id: taskActivities.id,
          actionType: taskActivities.actionType,
          oldValue: taskActivities.oldValue,
          newValue: taskActivities.newValue,
          createdAt: taskActivities.createdAt,
          user: { id: users.id, firstName: users.firstName, lastName: users.lastName }
        })
        .from(taskActivities)
        .leftJoin(users, eq(taskActivities.userId, users.id))
        .where(eq(taskActivities.taskId, taskId))
        .orderBy(desc(taskActivities.createdAt));
    }
  }
};