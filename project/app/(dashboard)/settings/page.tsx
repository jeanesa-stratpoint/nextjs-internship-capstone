import { User, Bell, Shield, Palette } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { queries } from "@/lib/db/queries";
import ProfileForm from "@/components/settings/profile-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const currentUser = await queries.users.getById(userId);
  const assignableRoles = await queries.users.getAssignableRoles();

  if (!currentUser) return <div>User not found.</div>;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-gray-500 mt-2">
          Manage your account profile and application preferences.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mt-8">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { name: "Profile", icon: User, active: true },
              { name: "Notifications", icon: Bell, active: false },
              { name: "Security", icon: Shield, active: false },
              { name: "Appearance", icon: Palette, active: false },
            ].map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  item.active
                    ? "bg-black text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <item.icon className="mr-3" size={18} />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3 bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-bold text-black mb-6 pb-4 border-b border-gray-100">
            Profile Settings
          </h3>

          <ProfileForm user={currentUser} assignableRoles={assignableRoles} />
        </div>
      </div>
    </div>
  );
}
