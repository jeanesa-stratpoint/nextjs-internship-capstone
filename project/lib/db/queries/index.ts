import { db } from "@/lib/db";
import { projects, projectMembers, lists, tasks, comments, taskActivities, users } from "@/lib/db/schema";
import { eq, desc, inArray, asc } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export const queries = {
  // PROJECT QUERIES
  projects: {
    getAllForUser: async (userId: string) => {
      return await db
        .select({ project: projects, role: projectMembers.role })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, userId))
        .orderBy(desc(projects.createdAt));
    },
    
    getById: async (id: string) => {
      const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      return result[0] || null;
    },

    getMembers: async (projectId: string) => {
      return await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));
    },

    getMembersForMultiple: async (projectIds: string[]) => {
      if (projectIds.length === 0) return [];
      return await db.select().from(projectMembers).where(inArray(projectMembers.projectId, projectIds));
    },

    getProjectsWithMetrics: async (userId: string) => {
      const userProjects = await db
        .select({ project: projects, role: projectMembers.role })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .where(eq(projectMembers.userId, userId))
        .orderBy(desc(projects.createdAt));

      if (userProjects.length === 0) return [];

      const projectIds = userProjects.map((p) => p.project.id);
      
      const ownerIds = [...new Set(userProjects.map((p) => p.project.ownerId))];
      const client = await clerkClient();
      const ownerData = await client.users.getUserList({ userId: ownerIds });
      const ownerNameMap = new Map(
        ownerData.data.map((u) => [
          u.id, 
          u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.emailAddresses[0].emailAddress
        ])
      );

      const allMembers = await db.select().from(projectMembers).where(inArray(projectMembers.projectId, projectIds));
      const allLists = await db.select().from(lists).where(inArray(lists.projectId, projectIds));
      const listIds = allLists.map((l) => l.id);
      const allTasks = listIds.length > 0 ? await db.select().from(tasks).where(inArray(tasks.listId, listIds)) : [];

      return userProjects.map(({ project, role }) => {
        const memberCount = allMembers.filter((m) => m.projectId === project.id).length;
        const projectListIds = allLists.filter((l) => l.projectId === project.id).map((l) => l.id);
        const projectTasks = allTasks.filter((t) => projectListIds.includes(t.listId));
        const doneListIds = allLists.filter((l) => l.projectId === project.id && l.name.toLowerCase() === "done").map((l) => l.id);
        const completedTasks = projectTasks.filter((t) => doneListIds.includes(t.listId)).length;

        return {
          project,
          role,
          metrics: {
            memberCount,
            taskCount: projectTasks.length,
            completedTaskCount: completedTasks,
            ownerName: ownerNameMap.get(project.ownerId) || "Unknown User",
            isOwner: project.ownerId === userId,
          }
        };
      });
    },
  },

  // KANBAN & TASK QUERIES
  tasks: {
    getListsByProject: async (projectId: string) => {
      return await db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.order));
    },

    getByListIds: async (listIds: string[]) => {
      if (listIds.length === 0) return [];
      return await db.select().from(tasks).where(inArray(tasks.listId, listIds)).orderBy(asc(tasks.order));
    },

    getById: async (taskId: string) => {
      const result = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      return result[0] || null;
    },

    getListById: async (id: string) => {
      const result = await db.select().from(lists).where(eq(lists.id, id)).limit(1);
      return result[0] || null;
    },

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