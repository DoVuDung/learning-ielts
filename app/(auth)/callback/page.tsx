"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      router.replace("/login?error=auth_failed");
      return;
    }
    // Token is set as HttpOnly cookie by the API route — just go home
    router.replace("/dictation");
  }, [router, searchParams]);

  return (
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
  );
}
