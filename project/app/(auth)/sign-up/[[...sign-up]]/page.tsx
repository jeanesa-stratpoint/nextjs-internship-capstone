import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-[680px] p-6 sm:p-8 ">
        <div className="flex justify-center w-full mb-4">
          <Image
            src="/levera-logo.svg"
            alt="Levera Logo"
            width={192}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        <SignUp
          appearance={{
            elements: {
              cardBox: "bg-transparent shadow-none border-none w-full",
              card: "bg-transparent shadow-none border-none",

              logoBox: "hidden",
              headerTitle:
                "text-2xl sm:text-3xl font-bold text-black dark:text-zinc-100 text-center",
              headerSubtitle:
                "text-sm sm:text-base text-gray-800 dark:text-zinc-400 text-center mb-4 mt-2",

              socialButtonsBlockButton:
                "border border-gray-300 dark:border-zinc-700 rounded-full py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-sm font-medium transition-colors text-black dark:text-zinc-200",
              socialButtonsBlockButtonText: "font-semibold",

              dividerRow: "my-4",
              dividerLine: "bg-gray-200 dark:bg-zinc-800",
              dividerText: "text-gray-400 dark:text-zinc-500 text-xs",

              formFieldLabel: "text-xs font-bold text-black dark:text-zinc-300 mb-1",
              formFieldInput:
                "rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 focus:ring-black dark:focus:ring-zinc-600 focus:border-black dark:focus:border-zinc-600 py-2.5 px-3 text-sm transition-colors",

              formFieldErrorText: "text-red-500 dark:text-red-400 text-xs font-medium mt-1.5",

              formButtonPrimary:
                "bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-gray-900 dark:hover:bg-zinc-300 rounded-full py-3 mt-4 text-sm font-bold uppercase tracking-wide transition-colors",

              footer: "bg-transparent border-none p-0 mt-6",
              footerAction: "bg-transparent border-none p-0 justify-center",
              footerActionText: "text-gray-600 dark:text-zinc-400 text-sm",
              footerActionLink:
                "text-black dark:text-zinc-100 font-bold hover:text-gray-800 dark:hover:text-zinc-300 text-sm",

              watermark: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
