"use client";

import { useEffect } from "react";
import Image from "next/image";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(`Authentication Error: ${error.message}`);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-[450px] p-8 text-center border border-transparent dark:border-zinc-800 transition-colors duration-300">
        <div className="flex justify-center w-full mb-6">
          <Image
            src="/levera-logo.svg"
            alt="Levera Logo"
            width={150}
            height={40}
            className="h-10 w-auto object-contain opacity-50"
          />
        </div>

        <h2 className="text-2xl font-bold text-black dark:text-zinc-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-8">
          We encountered a secure connection issue while loading the authentication system. Please
          try again.
        </p>

        <button
          onClick={() => reset()}
          className="bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-900 dark:hover:bg-zinc-300 rounded-full py-3 px-8 text-sm font-bold uppercase tracking-wide transition-colors w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
