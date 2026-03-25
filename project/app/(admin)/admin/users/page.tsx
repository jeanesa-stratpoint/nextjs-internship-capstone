"use client";

import { useAdminUsers } from "@/hooks/use-admin";
import { format } from "date-fns";
import { Loader2, Mail, Calendar, Shield } from "lucide-react";
import { useState } from "react";
import { useToastStore } from "@/stores/toast-store";

interface SystemRole {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  createdAt: string | Date;
  role: SystemRole | null;
}

export default function AdminUsersPage() {
  const { systemUsers, availableRoles, isLoading, changeUserRole } = useAdminUsers();
  const { showToast } = useToastStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setUpdatingId(userId);
    try {
      await changeUserRole.mutateAsync({ userId, roleId: newRoleId });
      showToast({ message: "User role updated successfully", type: "success" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      showToast({ message, type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-100">User Management</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">
          View all registered users and manage their global system permissions.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/50 text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-zinc-500">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">System Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {(systemUsers as AdminUser[])?.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-black dark:text-zinc-100">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          ID: {user.id.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 font-medium">
                      <Mail size={14} className="text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 font-medium">
                      <Calendar size={14} className="text-gray-400" />
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <div className="relative group/select w-44">
                        {updatingId === user.id ? (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                          </div>
                        ) : (
                          <select
                            defaultValue={user.roleId || ""}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-black dark:text-zinc-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          >
                            <option value="" disabled>
                              Select Role
                            </option>
                            {(availableRoles as SystemRole[])?.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-black dark:group-hover/select:text-white transition-colors">
                          <Shield size={14} />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
