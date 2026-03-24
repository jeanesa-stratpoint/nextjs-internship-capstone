"use server";

import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import { userRoleSchema } from "@/lib/validations";

export async function updateUserRoleAction(roleId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const validationResult = userRoleSchema.safeParse({ roleId });
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.issues[0].message };
    }
    const validRoleId = validationResult.data.roleId;

    const assignableRoles = await queries.users.getAssignableRoles();
    const isSafeRole = assignableRoles.some((role) => role.id === validRoleId);

    if (!isSafeRole) {
      console.warn(`[SECURITY] User ${userId} attempted to assume an unauthorized role: ${validRoleId}`);
      return { 
        success: false, 
        error: "Security Violation: You do not have permission to assume this role." 
      };
    }

    await queries.users.updateRole(userId, validRoleId);

    revalidatePath("/settings");
    revalidatePath("/team");
    
    return { success: true, message: "Profile updated successfully!" };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update profile." };
  }
}