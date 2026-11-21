"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRoleRoute } from "@/lib/roleRoutes";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const updateUser = () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse user:", e);
        }
      } else {
        setUser(null);
      }
    };

    updateUser();
    window.addEventListener("storage", updateUser);
    window.addEventListener("user-session-updated", updateUser);
    window.addEventListener("user-state-change", updateUser);
    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("user-session-updated", updateUser);
      window.removeEventListener("user-state-change", updateUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("user-session-updated"));
    window.dispatchEvent(new Event("user-state-change"));
    window.location.assign("/login");
  };

  if (!user) return null;

  const role = user.role ? user.role.toUpperCase() : "PATIENT";
  const homeLink = getRoleRoute(user.role);

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Brand */}
        <Link
          href={homeLink}
          className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-red-500 hover:text-red-400 transition"
        >
          <span className="text-2xl">🚑</span>
          <span className="tracking-tight text-white">
            Medical <span className="text-red-500">SOS</span>
          </span>
        </Link>

        {/* User Info & Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-bold text-xs sm:text-sm text-slate-100">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">{role}</p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold">
            <Link
              href="/profile"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              Profile
            </Link>

            {role === "PATIENT" && (
              <>
                <Link
                  href="/patient"
                  className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg border border-red-800/80 transition"
                >
                  SOS
                </Link>
                <Link
                  href="/healthcard"
                  className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800/80 transition hidden xs:inline-block"
                >
                  Health Card
                </Link>
                <Link
                  href="/appointments"
                  className="px-2.5 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-blue-300 rounded-lg border border-blue-800/80 transition"
                >
                  Consult
                </Link>
                <Link
                  href="/pharmacy"
                  className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-800/80 transition"
                >
                  Pharmacy
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 bg-red-950 text-red-400 hover:bg-red-900 hover:text-red-200 rounded-lg border border-red-900 transition"
              title="Sign out"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
