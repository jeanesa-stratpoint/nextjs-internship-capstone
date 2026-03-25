"use client";

import { useState } from "react";
import { Loader2, Briefcase } from "lucide-react";
import { useUserMutations } from "@/hooks/use-users";

interface RoleProp {
  id: string;
  name: string;
}

export default function OnboardingModal({ assignableRoles }: { assignableRoles: RoleProp[] }) {
  const { updateRole } = useUserMutations();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setError("Please select a role to continue.");
      return;
    }

    try {
      await updateRole.mutateAsync(selectedRoleId);
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save role.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 border border-blue-100">
          <Briefcase size={32} />
        </div>

        <h2 className="text-2xl font-black text-black mb-2">Welcome to Levera!</h2>
        <p className="text-gray-500 mb-8 text-sm">
          To get started, please select your primary role. Choose carefully, as this cannot be
          changed later.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-left">
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Your Job Title / Role
          </label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all text-sm text-black cursor-pointer mb-6"
            required
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

          <button
            type="submit"
            disabled={updateRole.isPending || !selectedRoleId}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateRole.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Profile...
              </>
            ) : (
              "Complete Setup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
