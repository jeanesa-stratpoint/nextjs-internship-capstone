import { User, Shield } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { UserProfile } from "@clerk/nextjs";
import { queries } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "@/components/settings/profile-form";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "profile";

  const currentUser = await queries.users.getById(userId);
  const assignableRoles = await queries.users.getAssignableRoles();

  if (!currentUser) return <div>User not found.</div>;

  const navItems = [
    { id: "profile", name: "Profile", icon: User },
    { id: "security", name: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-6 pb-10 mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-gray-500 mt-2">Manage your account profile and security preferences.</p>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col mt-8">
        {/* HORIZONTAL TOPBAR NAVIGATION */}
        <div className="flex items-center overflow-x-auto no-scrollbar border-b border-gray-100 bg-gray-50/50 px-4 sm:px-8 pt-4">
          <nav className="flex space-x-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/settings?tab=${item.id}`}
                  className={`flex items-center pb-4 text-sm font-medium transition-all relative whitespace-nowrap ${
                    isActive ? "text-black" : "text-gray-500 hover:text-black"
                  }`}
                >
                  <item.icon
                    className={`mr-2 ${isActive ? "text-black" : "text-gray-400"}`}
                    size={18}
                  />
                  {item.name}

                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-8 min-h-[500px]">
          {activeTab === "profile" && (
            <div className="animate-in fade-in duration-300 max-w-3xl">
              <h3 className="text-xl font-bold text-black mb-6 pb-4 border-b border-gray-50">
                Profile Settings
              </h3>
              <ProfileForm user={currentUser} assignableRoles={assignableRoles} />
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-in fade-in duration-300 w-full">
              <h3 className="text-xl font-bold text-black mb-2">Security & Authentication</h3>
              <p className="text-sm text-gray-500 mb-8 pb-4 border-b border-gray-50 max-w-3xl">
                Manage your password, two-factor authentication, and active device sessions.
              </p>

              {/* CLERK NATIVE UI WITH MOBILE OVERFLOW FIXES */}
              <div className="w-full overflow-hidden">
                <div
                  className="
                  [&_.cl-rootBox]:w-full 
                  [&_.cl-cardBox]:w-full 
                  [&_.cl-cardBox]:max-w-full 
                  [&_.cl-card]:w-full 
                  [&_.cl-card]:max-w-full 
                  [&_.cl-card]:shadow-none 
                  [&_.cl-card]:border-0 
                  [&_.cl-card]:bg-transparent 
                  [&_.cl-navbar]:hidden 
                  [&_.cl-pageScrollBox]:p-0 
                  [&_.cl-profileSection__profile]:hidden 
                  sm:[&_.cl-pageScrollBox]:px-2
                "
                >
                  <UserProfile routing="hash" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
