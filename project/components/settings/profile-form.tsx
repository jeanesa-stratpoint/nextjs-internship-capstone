"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { useUserMutations } from "@/hooks/use-users";

interface UserProp {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: string | null;
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
  const [selectedRoleId, setSelectedRoleId] = useState(user.roleId || "");

  const handleSave = async () => {
    if (selectedRoleId === user.roleId) {
      showToast({ message: "No changes to save.", type: "default" });
      return;
    }

    try {
      const result = await updateRole.mutateAsync(selectedRoleId);
      showToast({ message: result.message || "Profile updated successfully!", type: "success" });
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
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            disabled
            value={user.firstName || ""}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            disabled
            value={user.lastName || ""}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          disabled
          value={user.email}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="text-xs text-gray-400 mt-1">
          Manage your email and password via your account provider.
        </p>
      </div>

      {/* The Dynamic Role Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Job Title / Role</label>
        <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
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
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={updateRole.isPending || selectedRoleId === user.roleId}
          className="flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {updateRole.isPending && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
