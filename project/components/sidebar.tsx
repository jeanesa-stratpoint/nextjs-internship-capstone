"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  PieChart,
  CalendarDays,
  Bell,
  Settings,
  PanelLeftClose,
  Sun,
  //   Moon
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

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
    <aside className="w-64 flex flex-col py-6">
      <div className="flex items-center justify-between mb-8 px-4">
        <Image
          src="/levera-logo.svg"
          alt="Levera Logo"
          width={120}
          height={32}
          className="h-10 w-auto object-contain"
          priority
        />
        <button className="text-gray-500 hover:text-black transition-colors">
          <PanelLeftClose size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                isActive
                  ? "bg-white/60 text-black font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-white/40 hover:text-black"
              }`}
            >
              <Icon size={18} className={isActive ? "text-black" : "text-gray-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 px-4 mt-auto">
        <div className="flex items-center justify-between px-3 py-2 bg-white/40 rounded-xl text-sm font-medium text-gray-700">
          <span className="flex items-center gap-2">
            <Sun size={16} className="text-gray-500" /> Light
          </span>
          <div className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 py-2">
          <UserButton />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-black truncate w-40">
              {user?.fullName || "Loading..."}
            </span>
            <span className="text-xs text-gray-500 font-medium">Project Manager</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
