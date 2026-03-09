import { db } from "@/lib/db";
import { users, roles, rolePermissions, permissions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function hasSystemPermission(userId: string, requiredAction: string): Promise<boolean> {
  try {
    const result = await db
      .select({ action: permissions.action })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(users.id, userId),
          eq(permissions.action, requiredAction)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("RBAC Check Failed:", error);
    return false; 
  }
}