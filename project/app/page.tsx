// import Link from "next/link";
// import { ArrowRight, CheckCircle, Users, Kanban } from "lucide-react";
// import { ThemeToggle } from "@/components/theme-toggle";

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-platinum-900 to-platinum-800 dark:from-outer_space-500 dark:to-payne's_gray-500">
//       {/* Header */}
//       <header className="border-b border-french_gray-300 dark:border-payne's_gray-400 bg-white/80 dark:bg-outer_space-500/80 backdrop-blur-sm">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="text-2xl font-bold text-blue_munsell-500">ProjectFlow</div>
//             <div className="flex items-center space-x-4">
//               <ThemeToggle />
//               <Link
//                 href="/dashboard"
//                 className="text-outer_space-500 dark:text-platinum-500 hover:text-blue_munsell-500"
//               >
//                 Dashboard
//               </Link>
//               <Link
//                 href="/projects"
//                 className="text-outer_space-500 dark:text-platinum-500 hover:text-blue_munsell-500"
//               >
//                 Projects
//               </Link>
//               <Link
//                 href="/sign-in"
//                 className="text-outer_space-500 dark:text-platinum-500 hover:text-blue_munsell-500"
//               >
//                 Sign In
//               </Link>
//               <Link
//                 href="/sign-up"
//                 className="px-4 py-2 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600"
//               >
//                 Get Started
//               </Link>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="py-20 px-4 sm:px-6 lg:px-8">
//         <div className="container mx-auto text-center">
//           <h1 className="text-5xl md:text-6xl font-bold text-outer_space-500 dark:text-platinum-500 mb-6">
//             Manage Projects with
//             <span className="text-blue_munsell-500"> Kanban Boards</span>
//           </h1>

//           <p className="text-xl text-payne's_gray-500 dark:text-french_gray-500 mb-8 max-w-2xl mx-auto">
//             Organize tasks, collaborate with teams, and track progress with our intuitive
//             drag-and-drop project management platform.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
//             <Link
//               href="/dashboard"
//               className="inline-flex items-center px-8 py-4 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600 text-lg font-semibold"
//             >
//               Start Managing Projects
//               <ArrowRight className="ml-2" size={20} />
//             </Link>
//             <Link
//               href="/projects"
//               className="inline-flex items-center px-8 py-4 border-2 border-blue_munsell-500 text-blue_munsell-500 rounded-lg hover:bg-blue_munsell-50 dark:hover:bg-blue_munsell-900 text-lg font-semibold"
//             >
//               View Projects
//             </Link>
//           </div>

//           {/* Feature highlights */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
//             <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
//               <Kanban className="text-blue_munsell-500" size={20} />
//               <span>Drag & Drop Boards</span>
//             </div>
//             <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
//               <Users className="text-blue_munsell-500" size={20} />
//               <span>Team Collaboration</span>
//             </div>
//             <div className="flex items-center justify-center space-x-2 text-outer_space-500 dark:text-platinum-500">
//               <CheckCircle className="text-blue_munsell-500" size={20} />
//               <span>Task Management</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Navigation Demo Section */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-outer_space-400/50">
//         <div className="container mx-auto text-center">
//           <h2 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500 mb-8">
//             🚀 Navigate the Mock Site
//           </h2>
//           <p className="text-lg text-payne's_gray-500 dark:text-french_gray-500 mb-8">
//             All pages are accessible without authentication for development purposes
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
//             <Link
//               href="/dashboard"
//               className="p-4 bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 hover:shadow-lg transition-shadow"
//             >
//               <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                 Dashboard
//               </h3>
//               <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
//                 Main dashboard view
//               </p>
//             </Link>

//             <Link
//               href="/projects"
//               className="p-4 bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 hover:shadow-lg transition-shadow"
//             >
//               <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                 Projects
//               </h3>
//               <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
//                 Projects listing page
//               </p>
//             </Link>

//             <Link
//               href="/projects/1"
//               className="p-4 bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 hover:shadow-lg transition-shadow"
//             >
//               <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                 Kanban Board
//               </h3>
//               <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
//                 Project board view
//               </p>
//             </Link>

//             <Link
//               href="/sign-in"
//               className="p-4 bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 hover:shadow-lg transition-shadow"
//             >
//               <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                 Auth Pages
//               </h3>
//               <p className="text-sm text-payne's_gray-500 dark:text-french_gray-400">
//                 Sign in/up placeholders
//               </p>
//             </Link>
//           </div>
//         </div>
//       </section>

//       {/* Task Implementation Status */}
//       <section className="py-16 px-4 sm:px-6 lg:px-8">
//         <div className="container mx-auto">
//           <h2 className="text-3xl font-bold text-center text-outer_space-500 dark:text-platinum-500 mb-12">
//             Implementation Roadmap
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {[
//               { phase: "1.0", title: "Project Setup", status: "pending", tasks: 6 },
//               { phase: "2.0", title: "Authentication", status: "pending", tasks: 6 },
//               { phase: "3.0", title: "Database Setup", status: "pending", tasks: 6 },
//               { phase: "4.0", title: "Core Features", status: "pending", tasks: 6 },
//               { phase: "5.0", title: "Kanban Board", status: "pending", tasks: 6 },
//               { phase: "6.0", title: "Advanced Features", status: "pending", tasks: 6 },
//               { phase: "7.0", title: "Testing", status: "pending", tasks: 6 },
//               { phase: "8.0", title: "Deployment", status: "pending", tasks: 6 },
//             ].map((item) => (
//               <div
//                 key={item.phase}
//                 className="bg-white dark:bg-outer_space-500 p-6 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400"
//               >
//                 <div className="text-sm text-blue_munsell-500 font-semibold mb-2">
//                   Phase {item.phase}
//                 </div>
//                 <h3 className="font-semibold text-outer_space-500 dark:text-platinum-500 mb-2">
//                   {item.title}
//                 </h3>
//                 <div className="text-sm text-payne's_gray-500 dark:text-french_gray-400 mb-3">
//                   {item.tasks} tasks
//                 </div>
//                 <div className="flex items-center">
//                   <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
//                   <span className="text-sm text-payne's_gray-500 dark:text-french_gray-400 capitalize">
//                     {item.status}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, LayoutTemplate } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] relative flex flex-col overflow-hidden">
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


        <div className="w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[24px] shadow-2xl p-4 md:p-8 aspect-[16/9] flex items-center justify-center relative overflow-hidden">

          <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-white/20">
            <LayoutTemplate size={48} className="text-gray-400 mb-4" strokeWidth={1.5} />
            <p className="text-gray-500 font-medium text-lg">Dashboard Preview</p>
            <p className="text-gray-400 text-sm mt-1">
              Screenshot will be added here upon UI completion
            </p>
          </div>

          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl"></div>
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
