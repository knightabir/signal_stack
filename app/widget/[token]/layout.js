import { Outfit } from "next/font/google";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function WidgetLayout({ children }) {
  return (
    <div className={`${outfit.variable} font-sans bg-white text-slate-950 antialiased h-screen w-full`}>
      {children}
    </div>
  );
}

