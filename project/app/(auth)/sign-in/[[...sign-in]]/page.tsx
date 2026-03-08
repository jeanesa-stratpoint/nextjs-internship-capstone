// TODO: Task 2.3 - Create sign-in and sign-up pages
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl w-full max-w-[680px] p-4 sm:p-6">
        
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

        <SignIn
          appearance={{
            elements: {
              cardBox: "bg-transparent shadow-none border-none w-full",
              card: "bg-transparent shadow-none border-none", 
              
              logoBox: "hidden", 
              headerTitle: "text-2xl sm:text-3xl font-bold text-black text-center",
              headerSubtitle: "text-sm sm:text-base text-gray-800 text-center mb-4 mt-2",
              
              socialButtonsBlockButton:
                "border border-gray-300 rounded-full py-2.5 hover:bg-gray-50 text-sm font-medium transition-colors",
              socialButtonsBlockButtonText: "font-semibold",
              
              dividerRow: "my-4", 
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-400 text-xs",
              
              formFieldLabel: "text-xs font-bold text-black mb-1",
              formFieldInput:
                "rounded-lg border border-gray-300 focus:ring-black focus:border-black py-2.5 px-3 text-sm",
              
              formFieldErrorText: "text-red-500 text-xs font-medium mt-1.5",
              alert: "bg-red-50 border border-red-200 p-3 rounded-xl mb-4",
              alertText: "text-red-800 text-sm font-medium",
              formButtonPrimary:
                "bg-black text-white hover:bg-gray-900 rounded-full py-3 mt-4 text-sm font-bold uppercase tracking-wide transition-colors",
              
              footer: "bg-transparent border-none p-0 mt-6",
              footerAction: "bg-transparent border-none p-0 justify-center",
              footerActionText: "text-gray-600 text-sm",
              footerActionLink: "text-black font-bold hover:text-gray-800 text-sm",
              
              watermark: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
/*
TODO: Task 2.3 Implementation Notes:
- Import SignIn from @clerk/nextjs
- Configure sign-in redirects
- Style to match design system
- Add proper error handling
*/