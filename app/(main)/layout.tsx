"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { SideNav } from "@/components/side-nav";
import { LocaleProvider } from "@/lib/locale-context";
import { UserProvider } from "@/lib/user-context";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);

  return (
    <LocaleProvider>
      <UserProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Mobile overlay */}
          {open && (
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
          )}

          {/* Sidebar — always visible on lg+, drawer on mobile */}
          <div
            className={`
              fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto
              ${open ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <SideNav onNavigate={() => setOpen(false)} />
          </div>

          {/* Main content */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Mobile top bar with hamburger */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background lg:hidden shrink-0">
              <button
                onClick={() => setOpen(true)}
                className="flex items-center justify-center size-8 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
              <span className="text-sm font-bold text-foreground">BapEnglish</span>
            </div>

            {children}
          </div>
        </div>
      </UserProvider>
    </LocaleProvider>
  );
}

