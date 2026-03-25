"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] relative flex flex-col overflow-hidden">
      {/* Background SVG Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-80 mix-blend-multiply">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 1143"
          fill="none"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <g filter="url(#filter0_f_48_23)">
            <path
              d="M719 388.5L1439.5 150V993L719 645.5L2 993V150L719 388.5Z"
              fill="url(#paint0_linear_48_23)"
              fillOpacity="0.9"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_48_23"
              x="-148"
              y="0"
              width="1737.5"
              height="1143"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_48_23" />
            </filter>
            <linearGradient
              id="paint0_linear_48_23"
              x1="709.5"
              y1="153.5"
              x2="715"
              y2="1003.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.0817308" stopColor="#FFF4E4" />
              <stop offset="0.394231" stopColor="#FFE3DC" />
              <stop offset="0.456731" stopColor="#FFD5D6" />
              <stop offset="1" stopColor="#BAE2FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Image
          src="/levera-logo.svg"
          alt="Levera Logo"
          width={140}
          height={40}
          className="h-15 w-auto object-contain"
        />
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm font-semibold text-gray-700 hover:text-black uppercase transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="bg-black text-white text-sm font-bold tracking-wide uppercase px-6 py-3 rounded-full hover:bg-gray-800 transition-all shadow-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-24 pb-20 px-6 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-black tracking-tight max-w-4xl mb-6">
          Leverage Your Focus, <br className="hidden md:block" />
          Minimize the Noise
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Designed to help you structure your workflow, eliminate distractions, and turn focused
          work into measurable progress.
        </p>

        <Link
          href="/sign-up"
          className="group flex items-center gap-2 bg-black text-white text-base font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1 mb-20"
        >
          Start Managing Projects
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="w-full max-w-7xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-2xl p-4 md:p-6 aspect-[16/9] flex items-center justify-center relative overflow-hidden">
          <Image
            src="/dashboard.png"
            alt="Levera Dashboard Preview"
            width={1920}
            height={1000}
            className="w-full h-full object-cover rounded-2xl shadow-inner border border-white/20"
            priority
          />

          {/* Decorative blurs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl -z-10"></div>
        </div>

        <footer className="relative z-10 w-full border-t border-gray-200/60 bg-white/20 backdrop-blur-md mt-12">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Image
                src="/levera-logo.svg"
                alt="Levera Logo"
                width={100}
                height={28}
                className="h-6 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
              />
              <p className="text-sm text-gray-500 font-medium">
                © {new Date().getFullYear()} Levera. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
              <Link href="#" className="hover:text-black transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-black transition-colors">
                Terms of Service
              </Link>
              <Link
                href="https://github.com/jeanesa-stratpoint/nextjs-internship-capstone"
                target="_blank"
                className="hover:text-black transition-colors"
              >
                GitHub
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
