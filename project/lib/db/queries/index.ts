import { db } from "@/lib/db";
import { projects, projectMembers, lists, tasks, comments, taskActivities, users, roles } from "@/lib/db/schema";
import { eq, desc, inArray, asc, and } from "drizzle-orm";
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
        
        const projectLists = allLists
          .filter((l) => l.projectId === project.id)
          .sort((a, b) => a.order - b.order); // Sort Left to Right

        const projectListIds = projectLists.map((l) => l.id);
        const projectTasks = allTasks.filter((t) => projectListIds.includes(t.listId));

        const endListId = projectLists.length > 0 ? projectLists[projectLists.length - 1].id : null;
        
        const completedTasks = endListId 
          ? projectTasks.filter((t) => t.listId === endListId).length 
          : 0;

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

    create: async (data: { name: string; description?: string; ownerId: string; dueDate?: Date | null }) => {
      const [newProject] = await db.insert(projects).values(data).returning();
      return newProject;
    },
    addMembers: async (membersToInsert: { projectId: string; userId: string; role: string }[]) => {
      await db.insert(projectMembers).values(membersToInsert).onConflictDoNothing();
    },
    updateStatus: async (projectId: string, status: "active" | "completed" | "on-hold") => {
      await db.update(projects).set({ status }).where(eq(projects.id, projectId));
    },
    updateDetails: async (projectId: string, data: { name: string; description?: string | null; dueDate?: Date | null }) => {
      await db.update(projects).set(data).where(eq(projects.id, projectId));
    },
    delete: async (projectId: string) => {
      await db.delete(projects).where(eq(projects.id, projectId));
    },
    removeMember: async (projectId: string, userId: string) => {
      await db.delete(projectMembers).where(
        and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId))
      );
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

    getByIds: async (taskIds: string[]) => {
      if (taskIds.length === 0) return [];
      return await db.select().from(tasks).where(inArray(tasks.id, taskIds));
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
    },

    create: async (data: { 
      title: string; 
      listId: string; 
      order: number; 
      description?: string | null; 
      priority?: "low" | "medium" | "high"; 
      dueDate?: Date | null; 
      assigneeId?: string | null; 
    }) => {
      const [newTask] = await db.insert(tasks).values(data).returning();
      return newTask;
    },
    updateStatus: async (taskId: string, listId: string) => {
      await db.update(tasks).set({ listId }).where(eq(tasks.id, taskId));
    },
    updateDetails: async (taskId: string, data: {
      title?: string;
      description?: string | null;
      priority?: "low" | "medium" | "high";
      dueDate?: Date | null;
      assigneeId?: string | null;
      listId?: string;
    }) => {
      await db.update(tasks).set(data).where(eq(tasks.id, taskId));
    },
    updateOrderAndStatus: async (taskId: string, order: number, listId: string) => {
      await db.update(tasks).set({ order, listId }).where(eq(tasks.id, taskId));
    },
    delete: async (taskId: string) => {
      await db.delete(tasks).where(eq(tasks.id, taskId));
    },
    deleteAllInList: async (listId: string) => {
      await db.delete(tasks).where(eq(tasks.listId, listId));
    },
    logActivity: async (data: { taskId: string; userId: string; actionType: string; oldValue?: string; newValue?: string }) => {
      await db.insert(taskActivities).values(data);
    },
    logBulkActivities: async (activities: { taskId: string; userId: string | null; actionType: string; oldValue?: string | null; newValue?: string | null }[]) => {
      if (activities.length > 0) await db.insert(taskActivities).values(activities);
    }
  },

  lists: {
    create: async (data: { projectId: string; name: string; order: number; color: string; isCompleteStage: boolean }) => {
      const [newList] = await db.insert(lists).values(data).returning();
      return newList;
    },
    updateDetails: async (listId: string, name: string, color: string) => {
      await db.update(lists).set({ name, color }).where(eq(lists.id, listId));
    },
    updateOrder: async (listId: string, order: number) => {
      await db.update(lists).set({ order }).where(eq(lists.id, listId));
    },
    delete: async (listId: string) => {
      await db.delete(lists).where(eq(lists.id, listId));
    },
    syncCompleteStage: async (projectId: string) => {
      const projectLists = await db.select().from(lists).where(eq(lists.projectId, projectId)).orderBy(asc(lists.order));
      if (projectLists.length === 0) return;
      const lastListId = projectLists[projectLists.length - 1].id;
      await db.update(lists).set({ isCompleteStage: false }).where(eq(lists.projectId, projectId));
      await db.update(lists).set({ isCompleteStage: true }).where(eq(lists.id, lastListId));
    },
  },

  users: {
    getRoleName: async (userId: string) => {
      const dbUser = await db
        .select({ roleName: roles.name })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, userId))
        .limit(1);
        
      return dbUser[0]?.roleName || "Standard User";
    },

    getById: async (userId: string) => {
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return result[0] || null;
    }
  },
};