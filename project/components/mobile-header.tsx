"use client";

import { Menu } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";

export default function MobileHeader() {
  const { setMobileMenuOpen } = useUIStore();

  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0 rounded-t-[18px]">
      <Image
        src="/levera-logo.svg"
        alt="Levera Logo"
        width={90}
        height={24}
        className="h-6 w-auto object-contain"
        priority
      />
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="p-1.5 hover:bg-gray-100 rounded-lg text-black transition-colors"
      >
        <Menu size={24} />
      </button>
    </div>
  );
}
