"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  PieChart,
  CalendarDays,
  Bell,
  Settings,
  PanelLeftClose,
  PanelRightClose,
  Sun,
  X,
  //   Moon
} from "lucide-react";

export default function Sidebar({ roleName = "Loading..." }: { roleName?: string }) {
  const pathname = usePathname();
  const { user } = useUser();

  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Team", href: "/team", icon: Users },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative top-0 left-0 z-50 flex flex-col py-6 bg-[#E7E2DC] md:bg-transparent border-r border-white/50 md:border-none h-full transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "md:w-20" : "md:w-64"}
          ${isMobileMenuOpen ? "translate-x-0 w-64 px-4 shadow-2xl" : "-translate-x-full md:translate-x-0 px-0 md:px-0"}
        `}
      >
        <div
          className={`flex items-center mb-8 px-4 ${isSidebarCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!isSidebarCollapsed ? (
            <Image
              src="/levera-logo.svg"
              alt="Levera Logo"
              width={120}
              height={32}
              className="h-10 w-auto object-contain"
              priority
            />
          ) : (
            <Image
              src="/levera.svg"
              alt="Levera Logo"
              width={20}
              height={10}
              className="h-10 w-auto object-contain"
              priority
            />
          )}

          <button
            onClick={toggleSidebar}
            className="hidden md:block text-gray-500 hover:text-black transition-colors"
          >
            {isSidebarCollapsed ? (
              <PanelRightClose size={20} className="ml-5" />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-gray-500 hover:text-black transition-colors ml-auto"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isSidebarCollapsed ? item.name : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm whitespace-nowrap
                  ${isActive ? "bg-white/60 text-black font-semibold shadow-sm" : "text-gray-600 hover:bg-white/40 hover:text-black"}
                  ${isSidebarCollapsed ? "justify-center" : "justify-start"}
                `}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-black shrink-0" : "text-gray-500 shrink-0"}
                />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4 px-4 mt-auto pt-4">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-3 py-2 bg-white/40 rounded-xl text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2">
                <Sun size={16} className="text-gray-500" /> Light
              </span>
              <div className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
              </div>
            </div>
          )}

          <div
            className={`flex items-center gap-3 py-2 ${isSidebarCollapsed ? "justify-center" : "px-2"}`}
          >
            <UserButton />
            {!isSidebarCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-black truncate w-full">
                  {user?.fullName || "Loading..."}
                </span>
                <span className="text-xs text-gray-500 font-medium truncate">{roleName}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
