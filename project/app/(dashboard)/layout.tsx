import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import GlobalToast from "@/components/toast";
import EditProjectModal from "@/components/modals/edit-project-modal";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const clerkUser = await currentUser();
  let userRoleName = "Standard User";

  if (clerkUser) {
    userRoleName = await queries.users.getRoleName(clerkUser.id);
  }

  return (
    <div className="h-screen w-full overflow-hidden p-2 sm:p-4 md:p-6 flex bg-[linear-gradient(118deg,#E7E2DC_21.03%,#E0FAFF_68.51%,#F0F0F0_94.19%)]">
      <Sidebar roleName={userRoleName} />

      <main className="flex-1 bg-[#F8F8F8] rounded-[18px] shadow-sm ml-0 md:ml-6 overflow-hidden relative border border-white/50 flex flex-col min-w-0">
        <MobileHeader />
        <GlobalToast />
        <EditProjectModal />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
