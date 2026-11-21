"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { switchUserRole, loginUser } from "../actions";
import { getRoleRoute, type ValidRole } from "@/lib/roleRoutes";

const DEMO_ACCOUNTS = [
  { group: "Patients", email: "pat1@test.com", name: "Patient 1", role: "PATIENT", icon: "🤒" },
  { group: "Patients", email: "pat2@test.com", name: "Patient 2", role: "PATIENT", icon: "🤒" },
  { group: "Doctors", email: "doc1@test.com", name: "Dr. Doctor 1", role: "DOCTOR", icon: "👨‍⚕️" },
  { group: "Doctors", email: "doc2@test.com", name: "Dr. Doctor 2", role: "DOCTOR", icon: "👨‍⚕️" },
  { group: "Ambulance Drivers", email: "dri1@test.com", name: "Driver 1", role: "DRIVER", icon: "🚑" },
  { group: "Ambulance Drivers", email: "dri2@test.com", name: "Driver 2", role: "DRIVER", icon: "🚑" },
  { group: "Delivery Riders", email: "deli1@test.com", name: "Delivery Rider 1", role: "DELIVERY", icon: "🛵" },
  { group: "Delivery Riders", email: "deli2@test.com", name: "Delivery Rider 2", role: "DELIVERY", icon: "🛵" },
  { group: "Administration", email: "admin@test.com", name: "System Admin", role: "ADMIN", icon: "🚨" },
] as const;

const ROLES: { role: ValidRole; label: string; icon: string; path: string; color: string; activeColor: string }[] = [
  {
    role: "PATIENT",
    label: "Patient",
    icon: "🤒",
    path: "/patient",
    color: "border-rose-800/80 text-rose-300 hover:bg-rose-950/60 bg-rose-950/30",
    activeColor: "bg-rose-600 text-white border-rose-400 shadow-rose-500/30 shadow-md ring-2 ring-rose-400/30",
  },
  {
    role: "DOCTOR",
    label: "Doctor",
    icon: "👨‍⚕️",
    path: "/appointments",
    color: "border-blue-800/80 text-blue-300 hover:bg-blue-950/60 bg-blue-950/30",
    activeColor: "bg-blue-600 text-white border-blue-400 shadow-blue-500/30 shadow-md ring-2 ring-blue-400/30",
  },
  {
    role: "DRIVER",
    label: "Driver",
    icon: "🚑",
    path: "/driver",
    color: "border-amber-800/80 text-amber-300 hover:bg-amber-950/60 bg-amber-950/30",
    activeColor: "bg-amber-600 text-white border-amber-400 shadow-amber-500/30 shadow-md ring-2 ring-amber-400/30",
  },
  {
    role: "DELIVERY",
    label: "Delivery",
    icon: "🛵",
    path: "/delivery",
    color: "border-emerald-800/80 text-emerald-300 hover:bg-emerald-950/60 bg-emerald-950/30",
    activeColor: "bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30 shadow-md ring-2 ring-emerald-400/30",
  },
  {
    role: "ADMIN",
    label: "Admin",
    icon: "🚨",
    path: "/admin",
    color: "border-purple-800/80 text-purple-300 hover:bg-purple-950/60 bg-purple-950/30",
    activeColor: "bg-purple-600 text-white border-purple-400 shadow-purple-500/30 shadow-md ring-2 ring-purple-400/30",
  },
];

export default function LiveRoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Sync user state from localStorage and listen to updates
  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    loadUser();

    // Listen to local storage events across tabs or components
    window.addEventListener("storage", loadUser);
    window.addEventListener("user-session-updated", loadUser);
    window.addEventListener("user-state-change", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-session-updated", loadUser);
      window.removeEventListener("user-state-change", loadUser);
    };
  }, [pathname]);

  // If not logged in, or on public landing/login pages with no session, hide
  if (!user) return null;

  const currentRole = (user.role || "").toUpperCase();
  const normalizedCurrentRole = currentRole === "DELIVERY_MAN" ? "DELIVERY" : currentRole;

  // Handle instant live DB role change
  const handleRoleChange = async (targetRole: ValidRole) => {
    if (normalizedCurrentRole === targetRole || isPending) return;

    startTransition(async () => {
      try {
        const res = await switchUserRole(user.id, targetRole, user.email);
        if (res.success && res.user) {
          const updatedUser = {
            ...user,
            id: res.user.id,
            role: res.user.role,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);

          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSyncTime(now);
          setNotification(`DB Updated: Role switched to ${targetRole}`);

          // Dispatched events for other components
          window.dispatchEvent(new Event("user-session-updated"));
          window.dispatchEvent(new Event("user-state-change"));

          // Clean deterministic navigation
          const targetRoute = getRoleRoute(targetRole);
          window.location.assign(targetRoute);
        } else {
          setNotification(`Error: ${res.error || "Failed to update role"}`);
          setTimeout(() => setNotification(null), 5000);
        }
      } catch (err) {
        console.error("switchUserRole failed:", err);
        setNotification(err instanceof Error ? `Error: ${err.message}` : "Failed to switch role in DB.");
        setTimeout(() => setNotification(null), 5000);
      }
    });
  };

  // Handle instant 1-click switch between the 9 demo accounts
  const handleAccountSwitch = async (email: string) => {
    if (!email || (user.email && user.email.toLowerCase() === email.toLowerCase()) || isPending) return;

    startTransition(async () => {
      try {
        const res = await loginUser({ email, password: "123456" });
        if (res.success && res.user) {
          localStorage.setItem("user", JSON.stringify(res.user));
          setUser(res.user);

          const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSyncTime(now);
          setNotification(`Switched to account: ${res.user.email}`);

          window.dispatchEvent(new Event("user-session-updated"));
          window.dispatchEvent(new Event("user-state-change"));

          const targetRoute = getRoleRoute(res.user.role);
          window.location.assign(targetRoute);
        } else {
          setNotification(`Error: ${res.error || "Failed to switch account"}`);
          setTimeout(() => setNotification(null), 5000);
        }
      } catch (err) {
        console.error("Account switch error:", err);
        setNotification(err instanceof Error ? `Error: ${err.message}` : "Account switch failed");
        setTimeout(() => setNotification(null), 5000);
      }
    });
  };

  // Minimized floating badge
  if (isCollapsed) {
    return (
      <aside aria-label="Demo Role Switcher" className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 text-white rounded-full border border-slate-700 shadow-2xl text-xs font-bold transition hover:scale-105 active:scale-95"
          title="Expand Live Role Switcher"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-400">DB ROLE:</span>
          <span className="text-white font-extrabold">{normalizedCurrentRole}</span>
          <span className="text-slate-400 text-[10px]">▼ Expand</span>
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Demo Role Switcher" className="bg-slate-950/95 border-b border-slate-800 text-white text-xs sticky top-0 z-40 backdrop-blur-md shadow-xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Active User & Live PostgreSQL Status */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-300">
              <span className="text-emerald-400 font-extrabold">LIVE DB:</span> {user.name}
            </span>
            <span className="text-slate-500 hidden sm:inline">({user.email})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-300 font-semibold">
              PostgreSQL
            </span>
            {lastSyncTime && (
              <span className="text-[10px] text-slate-400 hidden lg:inline font-mono">
                synced {lastSyncTime}
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Role Changer Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden xl:inline mr-1">
            Change Role:
          </span>
          {ROLES.map((r) => {
            const isActive = normalizedCurrentRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => handleRoleChange(r.role)}
                disabled={isPending}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 select-none active:scale-95 disabled:opacity-50 ${
                  isActive ? r.activeColor : r.color
                }`}
                title={`Switch active user role in live database to ${r.label}`}
              >
                <span>{r.icon}</span>
                <span className="uppercase">{r.label}</span>
                {isActive && <span className="text-[10px] font-mono ml-0.5">●</span>}
              </button>
            );
          })}
        </div>

        {/* Right: 9-Account Quick Switch Dropdown + Minimize Toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative">
            <label htmlFor="quick-account-select" className="sr-only">Switch Demo Account</label>
            <select
              id="quick-account-select"
              aria-label="Switch Demo Account"
              disabled={isPending}
              value={
                DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === (user.email || "").toLowerCase().trim())
                  ? (user.email || "").toLowerCase().trim()
                  : ""
              }
              onChange={(e) => {
                if (e.target.value) handleAccountSwitch(e.target.value);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer disabled:opacity-50"
            >
              <option value="" disabled>
                Select / Switch Profile...
              </option>
              <optgroup label="Patients">
                <option value="pat1@test.com">🤒 Patient 1 (pat1@test.com)</option>
                <option value="pat2@test.com">🤒 Patient 2 (pat2@test.com)</option>
              </optgroup>
              <optgroup label="Doctors">
                <option value="doc1@test.com">👨‍⚕️ Dr. Doctor 1 (doc1@test.com)</option>
                <option value="doc2@test.com">👨‍⚕️ Dr. Doctor 2 (doc2@test.com)</option>
              </optgroup>
              <optgroup label="Ambulance Drivers">
                <option value="dri1@test.com">🚑 Driver 1 (dri1@test.com)</option>
                <option value="dri2@test.com">🚑 Driver 2 (dri2@test.com)</option>
              </optgroup>
              <optgroup label="Delivery Riders">
                <option value="deli1@test.com">🛵 Rider 1 (deli1@test.com)</option>
                <option value="deli2@test.com">🛵 Rider 2 (deli2@test.com)</option>
              </optgroup>
              <optgroup label="System Administration">
                <option value="admin@test.com">🚨 Admin (admin@test.com)</option>
              </optgroup>
            </select>
          </div>

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition text-[11px]"
            title="Minimize live switcher to bottom corner"
          >
            ▲
          </button>
        </div>
      </div>

      {/* Real-time Status / Feedback Notification */}
      {notification && (
        <div
          className={`border-t px-4 py-1 text-center font-mono text-[11px] flex items-center justify-center gap-2 animate-fadeIn ${
            notification.startsWith("Error:")
              ? "bg-rose-950/80 border-rose-800 text-rose-300"
              : "bg-slate-900 border-slate-800 text-emerald-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              notification.startsWith("Error:") ? "bg-rose-400" : "bg-emerald-400"
            }`}
          />
          <span>{notification}</span>
        </div>
      )}
    </aside>
  );
}

