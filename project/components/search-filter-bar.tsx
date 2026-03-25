"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";

export interface FilterConfig {
  id: string;
  label: string;
  options: { label: string; value: string }[];
}

interface SearchFilterBarProps {
  placeholder: string;
  filters: FilterConfig[];
}

export default function SearchFilterBar({ placeholder, filters }: SearchFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const currentQ = searchParams.get("q") || "";
    if (query === currentQ) return;

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");

      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, pathname, router, searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeFilterCount = filters.reduce((count, filter) => {
    const val = searchParams.get(filter.id);
    return val && val !== "all" ? count + 1 : count;
  }, 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
      <div className="relative w-full sm:flex-1 lg:w-[320px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
          size={16}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-2.5 bg-gray-100/60 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-700 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500 text-black dark:text-zinc-100"
        />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 border rounded-full text-sm font-medium transition-colors w-full sm:w-auto ${
            isFilterOpen || activeFilterCount > 0
              ? "bg-gray-200 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-black dark:text-zinc-100"
              : "bg-gray-100/60 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-800"
          }`}
        >
          <Filter size={16} />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-2 w-[280px] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[20px] shadow-xl z-50 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-black dark:text-zinc-100 text-sm">Filters</h4>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    filters.forEach((f) => params.delete(f.id));
                    router.push(`${pathname}?${params.toString()}`);
                    setIsFilterOpen(false);
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {filters.map((filter) => (
              <div key={filter.id}>
                <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-2 block tracking-wider">
                  {filter.label}
                </label>
                <select
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  value={searchParams.get(filter.id) || "all"}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 text-black dark:text-zinc-100 appearance-none cursor-pointer"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
