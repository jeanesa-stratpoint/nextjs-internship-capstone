import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkIsSystemAdmin } from "@/lib/db/queries/admin";
import Sidebar from "@/components/sidebar";
import GlobalToast from "@/components/toast";
import MobileHeader from "@/components/mobile-header";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const isAdmin = await checkIsSystemAdmin(userId);
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="h-screen w-full overflow-hidden p-2 sm:p-4 md:p-6 flex bg-zinc-100 dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar roleName="System Administrator" isAdmin={true} />

      <main className="flex-1 bg-white dark:bg-zinc-900 rounded-[18px] shadow-sm ml-0 md:ml-6 overflow-hidden relative border border-gray-200 dark:border-zinc-800 flex flex-col min-w-0 transition-colors duration-300">
        <MobileHeader />
        <GlobalToast />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
