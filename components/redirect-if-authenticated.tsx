"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api-client";

export function RedirectIfAuthenticated() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (token) {
      router.replace("/home");
    }
    // If no token, stay on login page — don't call authApi.me() unnecessarily
  }, [router]);

  return null;
}
