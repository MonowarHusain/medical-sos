"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRoleRoute } from "@/lib/roleRoutes";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(savedUser);
      if (!user || !user.role) {
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      const targetRoute = getRoleRoute(user.role);
      router.replace(targetRoute);
    } catch {
      localStorage.removeItem("user");
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-mono text-sm">Redirecting to your dashboard...</p>
    </div>
  );
}
