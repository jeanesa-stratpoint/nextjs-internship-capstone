import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import { checkIsSystemAdmin } from "@/lib/db/queries/admin";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import GlobalToast from "@/components/toast";
import EditProjectModal from "@/components/modals/edit-project-modal";
import OnboardingModal from "@/components/modals/onboarding-modal";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkUser = await currentUser();

  let userRoleName = "Standard User";
  let dbUser = null;
  let assignableRoles: { id: string; name: string }[] = [];
  let isAdmin = false;

  if (clerkUser) {
    // Parallel fetching for performance
    const [user, roleName, roles, adminStatus] = await Promise.all([
      queries.users.getById(clerkUser.id),
      queries.users.getRoleName(clerkUser.id),
      queries.users.getAssignableRoles(),
      checkIsSystemAdmin(clerkUser.id),
    ]);

    dbUser = user;
    userRoleName = roleName;
    assignableRoles = roles;
    isAdmin = adminStatus;
  }

  const needsOnboarding = dbUser && !dbUser.isRoleSelected;

  return (
    <div className="h-screen w-full overflow-hidden p-2 sm:p-4 md:p-6 flex bg-[linear-gradient(118deg,#E7E2DC_21.03%,#E0FAFF_68.51%,#F0F0F0_94.19%)] dark:bg-zinc-950 dark:bg-none transition-colors duration-300">
      {needsOnboarding && <OnboardingModal assignableRoles={assignableRoles} />}

      <Sidebar roleName={userRoleName} isAdmin={isAdmin} />

      <main className="flex-1 bg-[#F8F8F8] dark:bg-zinc-900 rounded-[18px] shadow-sm ml-0 md:ml-6 overflow-hidden relative border border-white/50 dark:border-zinc-800/50 flex flex-col min-w-0 transition-colors duration-300">
        <MobileHeader />
        <GlobalToast />
        <EditProjectModal />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
