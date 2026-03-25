"use client";

import { useAdminUsers } from "@/hooks/use-admin";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";

interface SystemRole {
  id: string;
  name: string;
}

interface PermissionAction {
  id: string;
  action: string;
}

interface Mapping {
  roleId: string;
  permissionId: string;
}

export default function RolePermissionsPage() {
  const { availableRoles, permissionsData, isLoading, togglePermission } = useAdminUsers();
  const { showToast } = useToastStore();

  const handleToggle = async (roleId: string, permissionId: string, currentStatus: boolean) => {
    try {
      await togglePermission.mutateAsync({ roleId, permissionId, assign: !currentStatus });
      showToast({ message: "Permission updated", type: "success" });
    } catch {
      showToast({ message: "Update failed", type: "error" });
    }
  };

  if (isLoading || !permissionsData) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-gray-400" />
      </div>
    );
  }

  const allPermissions = permissionsData.allPermissions as PermissionAction[];
  const mappings = permissionsData.mappings as Mapping[];
  const roles = availableRoles as SystemRole[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-zinc-100">Global Permissions</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">
          Manage what each system role is allowed to perform across the workspace.
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">
                  Permission Action
                </th>
                {roles?.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-4 text-xs font-bold uppercase text-center text-black dark:text-zinc-100"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50">
              {allPermissions.map((perm) => (
                <tr
                  key={perm.id}
                  className="hover:bg-gray-50/30 dark:hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-zinc-300">
                    <code className="bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400 text-xs">
                      {perm.action}
                    </code>
                  </td>
                  {roles?.map((role) => {
                    const isGranted = mappings.some(
                      (m) => m.roleId === role.id && m.permissionId === perm.id
                    );
                    return (
                      <td key={role.id} className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggle(role.id, perm.id, isGranted)}
                          disabled={togglePermission.isPending}
                          className={`p-2 rounded-xl transition-all ${
                            isGranted
                              ? "text-green-600 bg-green-50 dark:bg-green-500/10"
                              : "text-gray-300 bg-gray-50 dark:bg-zinc-800"
                          }`}
                        >
                          {isGranted ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
