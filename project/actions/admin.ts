"use server";

import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function updateUserSystemRole(targetUserId: string, newRoleId: string) {
  try {
    const { userId: adminId } = await auth();
    if (!adminId) throw new Error("Unauthorized");

    await queries.admin.updateUserRole(adminId, targetUserId, newRoleId);

    revalidatePath("/admin/users");
    return { success: true, message: "User role updated successfully." };
  } catch (error: unknown) {
    console.error("[UPDATE_USER_ROLE_ACTION]", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Failed to update user role");
  }
}

export async function toggleRolePermission(
  roleId: string,
  permissionId: string,
  assign: boolean
) {
  try {
    const { userId: adminId } = await auth();
    if (!adminId) throw new Error("Unauthorized");
    await queries.admin.togglePermission(adminId, roleId, permissionId, assign);

    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: unknown) {
    console.error("[TOGGLE_PERMISSION_ACTION]", error);
    if (error instanceof Error) throw new Error(error.message);
    throw new Error("Failed to update permission");
  }
}