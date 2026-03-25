export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#FAFAFA] dark:bg-zinc-950 transition-colors duration-300">
      {/* The Gradient SVG Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center w-full h-full object-cover dark:opacity-10 transition-opacity duration-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 1036"
          fill="none"
        >
          <g filter="url(#filter0_f_119_3)">
            <path
              d="M719 388.5L1439.5 150V993L719 645.5L2 993V150L719 388.5Z"
              fill="url(#paint0_linear_119_3)"
              fillOpacity="0.9"
            />
          </g>
          <defs>
            <filter
              id="filter0_f_119_3"
              x="-148"
              y="0"
              width="1737.5"
              height="1143"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="75" result="effect1_foregroundBlur_119_3" />
            </filter>
            <linearGradient
              id="paint0_linear_119_3"
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

      {/* The Auth Card Container */}
      <div className="relative z-10 w-full flex items-center justify-center px-4">{children}</div>
    </div>
  );
}
