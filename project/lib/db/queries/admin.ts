import { db } from "@/lib/db";
import { users, projects, rolePermissions } from "@/lib/db/schema";
import { desc, eq, count, and } from "drizzle-orm";

export async function checkIsSystemAdmin(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      role: {
        with: { 
          permissions: { 
            with: { 
              permission: true 
            } 
          } 
        },
      },
    },
  });

  return user?.role?.permissions.some(
    (rp) => rp.permission.action === "admin:access"
  ) ?? false;
}

export const adminQueries = {
  getSystemUsers: async (adminId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required.");

    return await db.query.users.findMany({
      with: { 
        role: true 
      },
      orderBy: [desc(users.createdAt)],
    });
  },
  

  getSystemStats: async (adminId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required.");

    const [userCountResult, activeProjectResult] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(projects).where(eq(projects.status, "active"))
    ]);

    return { 
      totalUsers: userCountResult[0].value, 
      activeProjects: activeProjectResult[0].value 
    }; 
  },

  getAllRoles: async (adminId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required.");

    return await db.query.roles.findMany({
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });
  },

  getAllPermissions: async (adminId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized");

    return await db.query.permissions.findMany({
      orderBy: (permissions, { asc }) => [asc(permissions.action)],
    });
  },

  getRolePermissions: async (adminId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized");

    return await db.query.rolePermissions.findMany();
  },

  updateUserRole: async (adminId: string, targetUserId: string, newRoleId: string) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required.");

    return await db
      .update(users)
      .set({ roleId: newRoleId })
      .where(eq(users.id, targetUserId));
  },

  togglePermission: async (
    adminId: string,
    roleId: string,
    permissionId: string,
    assign: boolean
  ) => {
    const isAdmin = await checkIsSystemAdmin(adminId);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required.");

    if (assign) {
      return await db.insert(rolePermissions).values({ roleId, permissionId });
    } else {
      return await db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId)
          )
        );
    }
  },
};