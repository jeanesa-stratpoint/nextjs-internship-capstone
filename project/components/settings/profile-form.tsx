"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { useUserMutations } from "@/hooks/use-users";

interface UserProp {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
  isRoleSelected: boolean;
}

interface RoleProp {
  id: string;
  name: string;
}

export default function ProfileForm({
  user,
  assignableRoles,
}: {
  user: UserProp;
  assignableRoles: RoleProp[];
}) {
  const { showToast } = useToastStore();
  const { updateRole } = useUserMutations();

  const isLocked = user.isRoleSelected;
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || "");

  const handleSave = async () => {
    if (selectedRoleId === user.roleId) {
      showToast({ message: "No changes to save.", type: "default" });
      return;
    }

    try {
      const result = await updateRole.mutateAsync(selectedRoleId);
      showToast({ message: result.message || "Profile updated successfully!", type: "success" });

      window.location.reload();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update.";
      showToast({ message: errorMessage, type: "error" });
      setSelectedRoleId(user.roleId || "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            First Name
          </label>
          <input
            type="text"
            disabled
            value={user.firstName || ""}
            className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            Last Name
          </label>
          <input
            type="text"
            disabled
            value={user.lastName || ""}
            className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          disabled
          value={user.email}
          className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-500 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          Manage your email and password via your account provider.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Job Title / Role
          </label>
          {isLocked && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
              <Lock size={12} /> Locked
            </span>
          )}
        </div>

        <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          disabled={isLocked}
          className={`w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 transition-colors ${
            isLocked
              ? "bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-500 cursor-not-allowed appearance-none"
              : "bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 cursor-pointer"
          }`}
        >
          <option value="" disabled>
            Select your role...
          </option>
          {assignableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>

        {isLocked ? (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1.5">
            Your role is permanently set. Contact a System Administrator to request a role change.
          </p>
        ) : (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 font-medium">
            Please select your job title carefully. This cannot be changed later.
          </p>
        )}
      </div>

      {!isLocked && (
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={updateRole.isPending || !selectedRoleId}
            className="flex items-center gap-2 px-6 py-2 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-full hover:bg-gray-800 dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateRole.isPending && <Loader2 size={14} className="animate-spin" />}
            Save Profile
          </button>
        </div>
      )}
    </div>
  );
}
