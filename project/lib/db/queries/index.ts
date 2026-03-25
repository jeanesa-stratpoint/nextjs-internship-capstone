import { db } from "@/lib/db";
import { projects, projectMembers, lists, tasks, comments, taskActivities, users, roles, events, projectInvitations, notifications } from "@/lib/db/schema";
import { eq, desc, inArray, asc, and, ne, gte, count, notInArray } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { calculateExpiryDate, isDateExpired } from "@/lib/utils";

export const queries = {
  // PROJECT QUERIES
  projects: {

    touchActivity: async (projectId: string) => {
      await db
        .update(projects)
        .set({ updatedAt: new Date() })
        .where(eq(projects.id, projectId));
    },

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
        .select({ 
          id: users.id, 
          firstName: users.firstName, 
          lastName: users.lastName, 
          email: users.email, 
          role: projectMembers.role,
          jobTitle: roles.name       
        })
        .from(projectMembers)
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(projectMembers.projectId, projectId));
    },

    getMemberRole: async (projectId: string, userId: string) => {
      const result = await db
        .select({ role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId)
          )
        )
        .limit(1);
      
      return result[0]?.role || null;
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
        .orderBy(desc(projects.updatedAt));
        

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

    getSentInvitations: async (userId: string) => {
      const rawInvitations = await db
        .select({
          id: projectInvitations.id,
          clerkId: projectInvitations.clerkId,
          email: projectInvitations.email,
          status: projectInvitations.status,
          createdAt: projectInvitations.createdAt,
          project: {
            id: projects.id,
            name: projects.name,
          }
        })
        .from(projectInvitations)
        .innerJoin(projects, eq(projectInvitations.projectId, projects.id))
        .where(eq(projectInvitations.invitedBy, userId))
        .orderBy(desc(projectInvitations.createdAt));

      return rawInvitations.map((invite) => {
        const expiryDate = calculateExpiryDate(invite.createdAt, 30);
        let displayStatus = invite.status as "pending" | "accepted" | "declined" | "revoked" | "expired";

        if (displayStatus === "pending" && isDateExpired(expiryDate)) {
          displayStatus = "expired";
        }

        return {
          ...invite,
          status: displayStatus,
          expiryDate,
        };
      });
    },

    getInvitationById: async (invitationId: string) => {
      const result = await db.select()
        .from(projectInvitations)
        .where(eq(projectInvitations.id, invitationId))
        .limit(1);
      return result[0] || null;
    },

    create: async (data: { name: string; description?: string; ownerId: string; dueDate?: Date | null }) => {
      const [newProject] = await db.insert(projects).values(data).returning();
      return newProject;
    },

    addMembers: async (membersToInsert: { projectId: string; userId: string; role: "admin" | "member" }[]) => {
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

    removeMemberFromAllOwnedProjects: async (ownerId: string, memberId: string) => {
      const ownedProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.ownerId, ownerId));

      const projectIds = ownedProjects.map((p) => p.id);

      if (projectIds.length > 0) {
        await db.delete(projectMembers).where(
          and(
            eq(projectMembers.userId, memberId),
            inArray(projectMembers.projectId, projectIds)
          )
        );
      }
    },

    createInvitation: async (data: { clerkId?: string; projectId: string; email: string; invitedBy: string }) => {
      const existing = await db.select().from(projectInvitations).where(
        and(
          eq(projectInvitations.projectId, data.projectId),
          eq(projectInvitations.email, data.email),
          eq(projectInvitations.status, 'pending')
        )
      ).limit(1);

      if (existing.length > 0) return { invite: existing[0], isNew: false };

      const [newInvite] = await db.insert(projectInvitations).values(data).returning();
      return { invite: newInvite, isNew: true };
    },

    revokeInvitation: async (invitationId: string) => {
      await db.update(projectInvitations)
        .set({ status: 'revoked' })
        .where(eq(projectInvitations.id, invitationId));
        
      await db.delete(notifications)
        .where(eq(notifications.referenceId, invitationId));
    },

    getPendingInvitationsByEmail: async (email: string) => {
      return await db.select()
        .from(projectInvitations)
        .where(
          and(
            eq(projectInvitations.email, email),
            eq(projectInvitations.status, 'pending')
          )
        );
    },

    markInvitationsAccepted: async (invitationIds: string[]) => {
      if (invitationIds.length === 0) return;
      await db.update(projectInvitations)
        .set({ status: 'accepted' })
        .where(inArray(projectInvitations.id, invitationIds));
    },

    getPendingInvitesByEmail: async (email: string) => {
      return await db.select()
        .from(projectInvitations)
        .where(
          and(
            eq(projectInvitations.email, email),
            eq(projectInvitations.status, 'pending')
          )
        );
    },

    batchAddMembers: async (members: (typeof projectMembers.$inferInsert)[]) => {
      if (members.length === 0) return;
      await db.insert(projectMembers).values(members).onConflictDoNothing();
    },

    batchUpdateInviteStatus: async (inviteIds: string[], status: "accepted" | "declined" | "pending") => {
      if (inviteIds.length === 0) return;
      await db.update(projectInvitations)
        .set({ status })
        .where(inArray(projectInvitations.id, inviteIds));
    },

    updateMemberRole: async (projectId: string, userId: string, newRole: "admin" | "member") => {
      await db
        .update(projectMembers)
        .set({ role: newRole })
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, userId)
          )
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

    getByProjectIds: async (projectIds: string[]) => {
      if (projectIds.length === 0) return [];
      
      const projectLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(inArray(lists.projectId, projectIds));
        
      const listIds = projectLists.map((l) => l.id);

      if (listIds.length === 0) return [];
      return await db.select().from(tasks).where(inArray(tasks.listId, listIds));
    },

    getUserTasks: async (userId: string) => {
      return await db
        .select({
          id: tasks.id,
          title: tasks.title,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
          listStage: lists.stage,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(tasks)
        .innerJoin(lists, eq(tasks.listId, lists.id))
        .innerJoin(projects, eq(lists.projectId, projects.id))
        .where(eq(tasks.assigneeId, userId))
        .orderBy(asc(tasks.dueDate));
    },

    create: async (data: { 
      title: string; 
      listId: string; 
      order: number; 
      description?: string | null; 
      contentHtml?: string | null;    
      attachmentUrl?: string | null;   
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
      contentHtml?: string | null;     
      attachmentUrl?: string | null;   
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
      const [inserted] = await db.insert(taskActivities).values(data).returning();
      
      const joined = await db
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
        .where(eq(taskActivities.id, inserted.id))
        .limit(1);
        
      return joined[0];
    },

    logBulkActivities: async (activities: { taskId: string; userId: string | null; actionType: string; oldValue?: string | null; newValue?: string | null }[]) => {
      if (activities.length === 0) return [];
      
      const inserted = await db.insert(taskActivities).values(activities).returning();
      const ids = inserted.map(a => a.id);
      
      const joined = await db
        .select({
          id: taskActivities.id,
          taskId: taskActivities.taskId, 
          actionType: taskActivities.actionType,
          oldValue: taskActivities.oldValue,
          newValue: taskActivities.newValue,
          createdAt: taskActivities.createdAt,
          user: { id: users.id, firstName: users.firstName, lastName: users.lastName }
        })
        .from(taskActivities)
        .leftJoin(users, eq(taskActivities.userId, users.id))
        .where(inArray(taskActivities.id, ids));
        
      return joined;
    },

    createComment: async (taskId: string, userId: string, content: string) => {
      const [newComment] = await db.insert(comments).values({
        taskId,
        userId,
        content,
      }).returning();

      const joinedComment = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          isEdited: comments.isEdited,
          user: { id: users.id, firstName: users.firstName, lastName: users.lastName }
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, newComment.id))
        .limit(1);

      return joinedComment[0];
    },

    unassignUserFromProjectTasks: async (projectId: string, userId: string) => {
      const projectLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(eq(lists.projectId, projectId));
        
      if (projectLists.length === 0) return;
      const listIds = projectLists.map(l => l.id);

      return await db
        .update(tasks)
        .set({ assigneeId: null })
        .where(
          and(
            inArray(tasks.listId, listIds),
            eq(tasks.assigneeId, userId)
          )
        );
    },

    unassignUserFromAllOwnedProjectsTasks: async (ownerId: string, memberIdToRemove: string) => {
      const ownedProjects = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.ownerId, ownerId));
        
      if (ownedProjects.length === 0) return;
      const projectIds = ownedProjects.map(p => p.id);

      const projectLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(inArray(lists.projectId, projectIds));
        
      if (projectLists.length === 0) return;
      const listIds = projectLists.map(l => l.id);

      return await db
        .update(tasks)
        .set({ assigneeId: null })
        .where(
          and(
            inArray(tasks.listId, listIds),
            eq(tasks.assigneeId, memberIdToRemove)
          )
      );
    },

    createDefaultLists: async (projectId: string) => {
      return await db.insert(lists).values([
        { name: "To Do", projectId: projectId, order: 0, stage: "unstarted" },
        { name: "In Progress", projectId: projectId, order: 1, stage: "in_progress" },
        { name: "Review", projectId: projectId, order: 2, stage: "in_progress" },
        { name: "Done", projectId: projectId, order: 3, stage: "completed" }, 
      ]).returning();
    },

  },

  lists: {
    create: async (data: { projectId: string; name: string; order: number; color: string; stage?: "unstarted" | "in_progress" | "completed" }) => {
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
    },

    getByIds: async (userIds: string[]) => {
      if (userIds.length === 0) return [];
      return await db.select().from(users).where(inArray(users.id, userIds));
    },

    getByEmail: async (email: string) => {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    },

    getTeamMembers: async (currentUserId: string) => {
      const userProjects = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, currentUserId));

      const projectIds = userProjects.map((up) => up.projectId);

      if (projectIds.length === 0) return [];

      const sharedMemberships = await db
        .select({
          userId: projectMembers.userId,
          status: projects.status,
          user: users,
          roleName: roles.name,
        })
        .from(projectMembers)
        .innerJoin(projects, eq(projectMembers.projectId, projects.id))
        .innerJoin(users, eq(projectMembers.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(
          and(
            inArray(projectMembers.projectId, projectIds),
            ne(projectMembers.userId, currentUserId) 
          )
        );

      type TeamMemberData = {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
        role: string;
        activeProjectCount: number;
      };  

      const teamMap = new Map<string, TeamMemberData>();

      sharedMemberships.forEach((sm) => {
        if (!teamMap.has(sm.userId)) {
          teamMap.set(sm.userId, {
            id: sm.user.id,
            firstName: sm.user.firstName,
            lastName: sm.user.lastName,
            email: sm.user.email,
            role: sm.roleName || "Standard User",
            activeProjectCount: 0,
          });
        }

        const userData = teamMap.get(sm.userId)!;
        if (sm.status !== "completed") {
          userData.activeProjectCount += 1;
        }
      });

      const teamArray = Array.from(teamMap.values());
      if (teamArray.length === 0) return [];

      const client = await clerkClient();
      const clerkUsers = await client.users.getUserList({
        userId: teamArray.map((u) => u.id),
      });

      const avatarMap = new Map(clerkUsers.data.map((cu) => [cu.id, cu.imageUrl]));

      return teamArray.map((u) => ({
        ...u,
        imageUrl: avatarMap.get(u.id) || null,
      }));
    },

    getRoleByName: async (name: string) => {
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);
      return role;
    },
    
    create: async (userData: typeof users.$inferInsert) => {
      const [newUser] = await db.insert(users).values(userData).returning();
      return newUser;
    },

    getAssignableRoles: async () => {
      const restrictedRoles = ["System Admin", "Super Admin", "Standard User"]; 

      return await db
        .select()
        .from(roles)
        .where(notInArray(roles.name, restrictedRoles))
        .orderBy(asc(roles.name)); 
    },

    updateRole: async (userId: string, roleId: string) => {
      await db
        .update(users)
        .set({ 
          roleId: roleId,
          isRoleSelected: true 
        })
        .where(eq(users.id, userId));
    },
    
  },

  // ANALYTICS QUERIES
  analytics: {
    getDashboardMetrics: async (userId: string) => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const userProjects = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, userId));

      const projectIds = userProjects.map((p) => p.projectId);

      if (projectIds.length === 0) {
        return {
          velocity: 0,
          efficiency: 0,
          activeUsers: 0,
          avgTaskTime: 0,
          progressChart: [],
          activityChart: [],
        };
      }

      const projectLists = await db
        .select()
        .from(lists)
        .where(inArray(lists.projectId, projectIds));
      
      const listIds = projectLists.map((l) => l.id);
      
      const projectTasks = listIds.length > 0
        ? await db.select().from(tasks).where(inArray(tasks.listId, listIds))
        : [];
      
      const taskIds = projectTasks.map((t) => t.id);

      const recentActivities = taskIds.length > 0
        ? await db.select().from(taskActivities).where(
            and(
              inArray(taskActivities.taskId, taskIds),
              gte(taskActivities.createdAt, sevenDaysAgo)
            )
          )
        : [];

      const recentComments = taskIds.length > 0
        ? await db.select().from(comments).where(
            and(
              inArray(comments.taskId, taskIds),
              gte(comments.createdAt, sevenDaysAgo)
            )
          )
        : [];

      // METRIC CALCULATIONS

      // Progress & Efficiency
      let completedCount = 0;
      let inProgressCount = 0;
      let unstartedCount = 0;

      projectTasks.forEach((task) => {
        const list = projectLists.find((l) => l.id === task.listId);
        if (list?.stage === "completed") completedCount++;
        else if (list?.stage === "in_progress") inProgressCount++;
        else if (list?.stage === "unstarted") unstartedCount++;
      });

      const efficiency = projectTasks.length > 0 
        ? Math.round((completedCount / projectTasks.length) * 100) 
        : 0;

      // Project Velocity (Tasks completed in the last 7 days)
      const completedListIds = projectLists.filter((l) => l.stage === "completed").map((l) => l.id);
      const completedTaskIds = projectTasks.filter((t) => completedListIds.includes(t.listId)).map((t) => t.id);
      
      const recentlyCompletedSet = new Set();
      recentActivities.forEach((act) => {
        if (completedTaskIds.includes(act.taskId)) recentlyCompletedSet.add(act.taskId);
      });
      const velocity = recentlyCompletedSet.size;

      // Active Users (Unique users who commented or moved a task in the last 7 days)
      const activeUsersSet = new Set<string>();
      recentActivities.forEach((act) => { if (act.userId) activeUsersSet.add(act.userId); });
      recentComments.forEach((com) => { if (com.userId) activeUsersSet.add(com.userId); });
      const activeUsers = activeUsersSet.size;

      // Average Task Time (For completed tasks only)
      let totalDays = 0;
      let tasksWithTime = 0;
      
      projectTasks.forEach((task) => {
        if (completedListIds.includes(task.listId)) {
          // Find the latest activity for this task to approximate completion time
          const taskActs = recentActivities.filter(a => a.taskId === task.id);
          const lastActDate = taskActs.length > 0 
            ? new Date(Math.max(...taskActs.map(a => a.createdAt.getTime()))) 
            : new Date(); // Fallback if no activity found

          const diffTime = Math.abs(lastActDate.getTime() - task.createdAt.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          
          totalDays += diffDays;
          tasksWithTime++;
        }
      });
      const avgTaskTime = tasksWithTime > 0 ? (totalDays / tasksWithTime).toFixed(1) : 0;

      // Build Team Activity Chart Data (Last 7 Days timeline)
      const activityChartMap = new Map();
      // Initialize the last 7 days with 0 to ensure the chart doesn't have gaps
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        activityChartMap.set(dayStr, { name: dayStr, actions: 0, comments: 0 });
      }

      recentActivities.forEach((act) => {
        const dayStr = act.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (activityChartMap.has(dayStr)) {
          activityChartMap.get(dayStr).actions += 1;
        }
      });

      recentComments.forEach((com) => {
        const dayStr = com.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (activityChartMap.has(dayStr)) {
          activityChartMap.get(dayStr).comments += 1;
        }
      });

      return {
        velocity,
        efficiency,
        activeUsers,
        avgTaskTime,
        progressChart: [
          { name: "To Do", value: unstartedCount },
          { name: "In Progress", value: inProgressCount },
          { name: "Completed", value: completedCount },
        ],
        activityChart: Array.from(activityChartMap.values()),
      };
    },

    getDashboardStats: async (userId: string) => {
      const teamMembers = await queries.users.getTeamMembers(userId);
      const projectsWithMetrics = await queries.projects.getProjectsWithMetrics(userId);
      const myTasks = await queries.tasks.getUserTasks(userId);
      const analyticsData = await queries.analytics.getDashboardMetrics(userId);

      // Fetch all tasks in your projects to check due dates
      const allProjectTasks = await db
        .select({
          id: tasks.id,
          dueDate: tasks.dueDate,
          listStage: lists.stage,
        })
        .from(tasks)
        .innerJoin(lists, eq(tasks.listId, lists.id))
        .innerJoin(projectMembers, eq(lists.projectId, projectMembers.projectId))
        .where(eq(projectMembers.userId, userId));

      const activeProjects = projectsWithMetrics.filter(p => p.project.status === "active");
      const activeProjectsCount = activeProjects.length;
      const teamCount = teamMembers.length;

      let completedTasksCount = 0;
      let pendingTasksCount = 0;

      projectsWithMetrics.forEach(p => {
        completedTasksCount += p.metrics.completedTaskCount;
        pendingTasksCount += (p.metrics.taskCount - p.metrics.completedTaskCount);
      });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const nextSevenDays = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const formatGrowth = (pct: number) => {
        if (pct > 0) return `+${pct}%`;
        if (pct < 0) return `${pct}%`; // Negative already includes the '-' sign
        return "0%";
      };

      // This Week vs Last Week 
      // Projects Growth
      const createdThisWeek = activeProjects.filter(p => new Date(p.project.createdAt) >= thisWeekStart).length;
      const createdLastWeek = activeProjects.filter(p => {
        const d = new Date(p.project.createdAt);
        return d >= lastWeekStart && d < thisWeekStart;
      }).length;

      let projectGrowthPct = 0;
      if (createdLastWeek > 0) {
        projectGrowthPct = Math.round(((createdThisWeek - createdLastWeek) / createdLastWeek) * 100);
      } else if (createdThisWeek > 0) {
        projectGrowthPct = 100; // Infinite growth from zero
      }

      // Completed Tasks Growth
      const completedThisWeek = analyticsData.velocity;
      const oldCompletedCount = completedTasksCount - completedThisWeek;
      
      let completedGrowthPct = 0;
      if (oldCompletedCount > 0) {
        completedGrowthPct = Math.round(((completedThisWeek - oldCompletedCount) / oldCompletedCount) * 100);
      } else if (completedThisWeek > 0) {
        completedGrowthPct = 100;
      }

      // Team Activity
      const activeTeamPercentage = teamCount > 0 
        ? Math.round((Math.min(analyticsData.activeUsers, teamCount) / teamCount) * 100) 
        : 0;

      // Pending Tasks Due Soon (all project tasks)
      const dueThisWeekCount = allProjectTasks.filter(t => {
        if (t.listStage === "completed" || !t.dueDate) return false;
        
        const dueDate = new Date(t.dueDate);
        const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        return dueMidnight >= today && dueMidnight <= nextSevenDays;
      }).length;

      return {
        activeProjectsCount,
        projectGrowth: formatGrowth(projectGrowthPct),
        teamCount,
        activeTeamPercentage: `${activeTeamPercentage}% active`,
        completedTasksCount,
        completedGrowth: formatGrowth(completedGrowthPct),
        pendingTasksCount,
        dueThisWeekCount: dueThisWeekCount,
        recentProjects: projectsWithMetrics.slice(0, 3),
        myTasks
      };
    }
  },

  // EVENT QUERIES
  events: {
    getByProjectIds: async (projectIds: string[]) => {
      if (projectIds.length === 0) return [];
      
      return await db
        .select({
          id: events.id,
          projectId: events.projectId,
          title: events.title,
          description: events.description,
          type: events.type,
          startTime: events.startTime,
          endTime: events.endTime,
          creatorId: events.creatorId,
          createdAt: events.createdAt,
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          }
        })
        .from(events)
        .leftJoin(users, eq(events.creatorId, users.id))
        .where(inArray(events.projectId, projectIds))
        .orderBy(asc(events.startTime));
    },

    create: async (data: {
      projectId: string;
      title: string;
      description?: string | null;
      type: "meeting" | "milestone" | "reminder";
      startTime: Date;
      endTime: Date;
      creatorId: string;
    }) => {
      const [newEvent] = await db.insert(events).values(data).returning();
      return newEvent;
    },

    updateDetails: async (eventId: string, data: {
      title?: string;
      description?: string | null;
      type?: "meeting" | "milestone" | "reminder";
      startTime?: Date;
      endTime?: Date;
    }) => {
      const [updatedEvent] = await db.update(events).set(data).where(eq(events.id, eventId)).returning();
      return updatedEvent;
    },

    delete: async (eventId: string) => {
      await db.delete(events).where(eq(events.id, eventId));
    },
  },

  // NOTIFICATIONS QUERIES
  notifications: {
    getUserNotifications: async (userId: string) => {
      return await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          actionUrl: notifications.actionUrl,
          referenceId: notifications.referenceId,
          createdAt: notifications.createdAt,
          actor: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
          invitationStatus: projectInvitations.status,
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.actorId, users.id))
        .leftJoin(projectInvitations, eq(notifications.referenceId, projectInvitations.id))
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
    },

    markAsRead: async (notificationId: string, userId: string) => {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    },

    markAllAsRead: async (userId: string) => {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));
    },

    getUnreadCount: async (userId: string) => {
      const result = await db.select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      return result[0].value;
    },

    create: async (data: { 
      userId: string; 
      actorId: string; 
      type: "project_invite" | "task_assigned" | "mention" | "system"; 
      title: string; 
      message: string; 
      actionUrl?: string; 
      referenceId?: string 
    }) => {
      const [newNotification] = await db.insert(notifications).values(data).returning();
      return newNotification;
    },

    resolveProjectInvite: async (
      notificationId: string, 
      invitationId: string, 
      status: "accepted" | "declined", 
      userId: string, 
      projectId?: string,
      email?: string
    ) => {
      await db.update(projectInvitations).set({ status }).where(eq(projectInvitations.id, invitationId));
      
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
      
      if (status === "accepted" && projectId && email) {
        await db.insert(projectMembers).values({ projectId, userId, role: "member" }).onConflictDoNothing();

        const duplicateInvites = await db.select().from(projectInvitations).where(
          and(
            eq(projectInvitations.projectId, projectId),
            eq(projectInvitations.email, email),
            eq(projectInvitations.status, 'pending')
          )
        );

        if (duplicateInvites.length > 0) {
          const duplicateIds = duplicateInvites.map(i => i.id);
          
          await db.update(projectInvitations)
            .set({ status: 'declined' }) // Or 'revoked'
            .where(inArray(projectInvitations.id, duplicateIds));

          
          await db.update(notifications)
            .set({ isRead: true })
            .where(inArray(notifications.referenceId, duplicateIds));
        }
      }
    },

    markAsUnread: async (notificationId: string, userId: string) => {
      await db.update(notifications)
        .set({ isRead: false })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    },
  },
};