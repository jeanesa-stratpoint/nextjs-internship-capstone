"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { useUIStore } from "@/stores/ui-store";
import { useEffect, useState } from "react";
import NotificationBadge from "@/components/notification-badge";
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
  Moon,
  X,
} from "lucide-react";

export default function Sidebar({ roleName = "Loading..." }: { roleName?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const { user } = useUser();

  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen, setMobileMenuOpen]);

  const effectivelyCollapsed = isSidebarCollapsed && !isMobileMenuOpen;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Team", href: "/team", icon: Users },
    { name: "Analytics", href: "/analytics", icon: PieChart },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);
  const isDark = theme === "dark";

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
          className={`flex items-center mb-8 px-4 ${effectivelyCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!effectivelyCollapsed ? (
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
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm whitespace-nowrap
                  ${
                    isActive
                      ? "bg-white/60 dark:bg-zinc-800 text-black dark:text-white font-semibold shadow-sm"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-zinc-200"
                  }
                  ${effectivelyCollapsed ? "justify-center" : "justify-start"}
                `}
              >
                {/* 1. Wrap Icon in relative div so the dot can position itself */}
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={18}
                    className={isActive ? "text-black shrink-0" : "text-gray-500 shrink-0"}
                  />
                  {/* 2. Tiny Dot Render (when collapsed) */}
                  {item.name === "Notifications" && effectivelyCollapsed && (
                    <NotificationBadge isCollapsed={true} />
                  )}
                </div>

                {!effectivelyCollapsed && <span className="truncate">{item.name}</span>}

                {/* 3. Numbered Pill Render (when expanded) */}
                {item.name === "Notifications" && !effectivelyCollapsed && (
                  <NotificationBadge isCollapsed={false} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4 px-4 mt-auto pt-4 border-t border-transparent dark:border-zinc-800/50">
          {!effectivelyCollapsed && mounted && (
            <div
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center justify-between px-3 py-2 bg-white/40 dark:bg-zinc-900/50 rounded-xl text-sm font-medium text-gray-700 dark:text-zinc-300 cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                {isDark ? (
                  <Moon size={16} className="text-zinc-400" />
                ) : (
                  <Sun size={16} className="text-gray-500" />
                )}
                {isDark ? "Dark" : "Light"}
              </span>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div
                  className={`w-3 h-3 bg-white rounded-full absolute top-0.5 shadow-sm transition-all duration-300 ${isDark ? "left-4.5 translate-x-full" : "left-0.5"}`}
                ></div>
              </div>
            </div>
          )}

          <div
            className={`flex items-center gap-3 py-2 ${effectivelyCollapsed ? "justify-center" : "px-2"}`}
          >
            <UserButton
              appearance={{
                elements: { userButtonPopoverCard: "dark:bg-zinc-900 dark:border-zinc-800" },
              }}
            />
            {!effectivelyCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-black dark:text-white truncate w-full">
                  {user?.fullName || "Loading..."}
                </span>
                <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium truncate">
                  {roleName}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
