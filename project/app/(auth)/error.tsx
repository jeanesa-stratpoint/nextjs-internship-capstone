'use client';

import { useEffect } from 'react';
import Image from 'next/image';

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
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-[450px] p-8 text-center">
        
        <div className="flex justify-center w-full mb-6">
          <Image 
            src="/levera-logo.svg" 
            alt="Levera Logo" 
            width={150}   
            height={40}   
            className="h-10 w-auto object-contain opacity-50"
          />
        </div>

        <h2 className="text-2xl font-bold text-black mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-8">
          We encountered a secure connection issue while loading the authentication system. Please try again.
        </p>
        
        <button
          onClick={() => reset()}
          className="bg-black text-white hover:bg-gray-900 rounded-full py-3 px-8 text-sm font-bold uppercase tracking-wide transition-colors w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}