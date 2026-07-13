"use client";

import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthCallbackPage() {
  useEffect(() => {
    // Read directly from window.location to avoid useSearchParams hydration issues
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    console.log("[auth/callback] URL:", window.location.href);
    console.log("[auth/callback] token present:", Boolean(token));
    console.log("[auth/callback] error:", error);

    if (error) {
      console.log("[auth/callback] → /login (error)");
      window.location.replace("/login?error=auth_failed");
      return;
    }

    if (token) {
      try {
        localStorage.setItem("access_token", token);
        document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
        console.log("[auth/callback] token saved:", token.substring(0, 20) + "...");
        console.log("[auth/callback] localStorage check:", localStorage.getItem("access_token")?.substring(0, 20) + "...");
      } catch (e) {
        console.error("[auth/callback] save failed:", e);
      }
      console.log("[auth/callback] → /home");
      window.location.replace("/home");
      return;
    }

    console.log("[auth/callback] no token, no error → /login");
    window.location.replace("/login");
  }, []); // Empty deps — run once on mount, read URL directly

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 border border-primary/20">
          <svg className="size-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-medium text-foreground">Đang đăng nhập…</p>
          <p className="text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </div>
    </div>
  );
}
