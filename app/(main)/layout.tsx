import { SideNav } from "@/components/side-nav";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideNav />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
