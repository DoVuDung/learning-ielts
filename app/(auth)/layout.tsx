import { ThreeBg } from "@/components/three-bg";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <ThreeBg />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
