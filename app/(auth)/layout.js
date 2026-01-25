export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black selection:bg-indigo-500/20">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]" />
      <div className="relative w-full max-w-md px-4 py-8">
        {children}
        <div className="mt-8 text-center text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} SignalStack. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
