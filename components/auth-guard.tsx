"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let token = localStorage.getItem("access_token");
    if (!token) {
      const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (match) {
        token = decodeURIComponent(match[1]);
        try {
          localStorage.setItem("access_token", token);
        } catch {}
      }
    }
    return token;
  } catch {
    return null;
  }
}

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setChecking(false);
      router.replace("/login");
      return;
    }

    if (!loading) {
      if (!user) {
        try {
          localStorage.removeItem("access_token");
          sessionStorage.clear();
          document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
        } catch {}
        setChecking(false);
        router.replace("/login");
      } else {
        setChecking(false);
      }
    }
  }, [user, loading, router]);

  const hasToken = Boolean(getStoredToken());

  // Nếu không có token hoặc sau khi kiểm tra không có user hợp lệ -> không cho dùng bất kỳ chức năng nào của hệ thống
  if (!hasToken || (!loading && !user)) {
    return null;
  }

  // Đang kiểm tra token / phiên đăng nhập -> hiển thị màn hình chờ để ngăn chặn sử dụng hệ thống
  if (loading || checking) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg
              className="size-5 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Đang kiểm tra phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
