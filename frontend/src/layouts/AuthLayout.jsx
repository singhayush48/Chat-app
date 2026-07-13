export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface/60 p-8 shadow-2xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
